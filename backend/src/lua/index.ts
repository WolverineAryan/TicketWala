import crypto from "crypto";
import type Redis from "ioredis";

export const ADAPTIVE_BALANCE_LUA = `
-- KEYS: [1] queue_key, [2] bucket_key
-- ARGV: [1] base_capacity, [2] base_refill_rate, [3] now_ms
local avail_seats = redis.call('LLEN', KEYS[1])

-- Instant O(1) Short-Circuit when 0 seats remain
if avail_seats == 0 then
    return cjson.encode({ admitted = 0, reason = "SOLD_OUT", code = 409, remaining = 0 })
end

-- Adaptive Balancing: scale token bucket dynamically based on seat scarcity
local bucket = redis.call('HMGET', KEYS[2], 'tokens', 'last_updated')
local base_cap = tonumber(ARGV[1]) or 1000
local base_rate = tonumber(ARGV[2]) or 500
local now = tonumber(ARGV[3])

-- Dynamic capacity: allow high burst when many seats remain, throttle as inventory depletes
local dynamic_cap = math.min(base_cap, math.max(10, avail_seats * 2))
local dynamic_rate = math.min(base_rate, math.max(5, avail_seats))

local tokens = tonumber(bucket[1]) or dynamic_cap
local last_updated = tonumber(bucket[2]) or now

local elapsed = math.max(0, (now - last_updated) / 1000)
tokens = math.min(dynamic_cap, tokens + (elapsed * dynamic_rate))
last_updated = now

if tokens >= 1 then
    tokens = tokens - 1
    redis.call('HMSET', KEYS[2], 'tokens', tokens, 'last_updated', last_updated)
    return cjson.encode({ admitted = 1, remaining = avail_seats, code = 200 })
else
    redis.call('HMSET', KEYS[2], 'tokens', tokens, 'last_updated', last_updated)
    return cjson.encode({ admitted = 0, reason = "RATE_LIMITED", code = 429, remaining = avail_seats })
end
`;

export const HOLD_FCFS_LUA = `
-- KEYS: [1] fifo_queue, [2] unit_prefix, [3] res_prefix, [4] idemp_prefix, [5] stream_key
-- ARGV: [1] idemp_scope_key, [2] req_fingerprint, [3] res_id, [4] token_hash, [5] ttl_seconds, [6] server_now

local idemp_key = KEYS[4] .. ":" .. ARGV[1]
local cached_res = redis.call('GET', idemp_key)
if cached_res then
    local parsed = cjson.decode(cached_res)
    if parsed.fingerprint and parsed.fingerprint ~= ARGV[2] then
        return cjson.encode({ error = "IDEMPOTENCY_CONFLICT", code = 422, message = "Idempotency key reuse with different parameters" })
    end
    return cached_res
end

-- 1. Pop next unit from FIFO List in exact arrival sequence (Strict FCFS) or claim specific unit
local unit_id = nil
if ARGV[7] and ARGV[7] ~= '' then
    local req_unit_key = KEYS[2] .. ":" .. ARGV[7]
    local req_status = redis.call('HGET', req_unit_key, 'status')
    if req_status == 'AVAILABLE' then
        unit_id = ARGV[7]
        redis.call('LREM', KEYS[1], 1, unit_id)
    else
        return cjson.encode({ error = "SEAT_UNAVAILABLE", code = 409, message = "Selected seat is already held or booked" })
    end
else
    unit_id = redis.call('RPOP', KEYS[1])
end

if not unit_id then
    return cjson.encode({ error = "SOLD_OUT", code = 409, message = "No available inventory units remain" })
end

-- 2. Bind unit and reservation atomically with monotonic versioning
local unit_key = KEYS[2] .. ":" .. unit_id
local res_key = KEYS[3] .. ":" .. ARGV[3]
local expires_at = tonumber(ARGV[6]) + tonumber(ARGV[5])
local version = 1

redis.call('HMSET', unit_key,
    'status', 'HELD',
    'reservation_id', ARGV[3],
    'token_hash', ARGV[4],
    'expires_at', expires_at,
    'version', version
)

redis.call('HMSET', res_key,
    'unit_id', unit_id,
    'status', 'HELD',
    'token_hash', ARGV[4],
    'expires_at', expires_at,
    'version', version,
    'created_at', ARGV[6]
)

-- 3. Append to event stream for eventual consistency
local event_id = redis.call('XADD', KEYS[5], '*',
    'event_type', 'HOLD_CREATED',
    'reservation_id', ARGV[3],
    'unit_id', unit_id,
    'version', version,
    'occurred_at', ARGV[6]
)

-- 4. Cache idempotency outcome (10 min TTL)
local response = cjson.encode({
    reservationId = ARGV[3],
    unitId = unit_id,
    status = 'HELD',
    expiresAt = expires_at,
    version = version,
    eventId = event_id,
    fingerprint = ARGV[2]
})

redis.call('SETEX', idemp_key, 600, response)
return response
`;

export const CONFIRM_LUA = `
-- KEYS: [1] unit_prefix, [2] res_prefix, [3] stream_key, [4] idemp_prefix
-- ARGV: [1] res_id, [2] token_hash, [3] server_now, [4] idemp_key

if ARGV[4] and ARGV[4] ~= '' then
    local cached_confirm = redis.call('GET', KEYS[4] .. ":" .. ARGV[4])
    if cached_confirm then return cached_confirm end
end

local res_key = KEYS[2] .. ":" .. ARGV[1]
local res_data = redis.call('HMGET', res_key, 'unit_id', 'status', 'token_hash', 'expires_at', 'version')

local unit_id = res_data[1]
local current_status = res_data[2]
local expected_token_hash = res_data[3]
local expires_at = tonumber(res_data[4])
local current_res_ver = tonumber(res_data[5]) or 1

if not unit_id or not current_status then
    return cjson.encode({ error = "NOT_FOUND", code = 404, message = "Reservation not found" })
end

if current_status == 'CONFIRMED' then
    return cjson.encode({
        reservationId = ARGV[1],
        unitId = unit_id,
        status = 'CONFIRMED',
        version = current_res_ver,
        code = 200,
        message = "Reservation already confirmed"
    })
end

if current_status == 'EXPIRED' or current_status == 'RELEASED' then
    return cjson.encode({ error = "HOLD_EXPIRED", code = 409, message = "Hold has expired or was released" })
end

-- Validate Cryptographic Token Hash
if expected_token_hash ~= ARGV[2] then
    return cjson.encode({ error = "INVALID_HOLD_TOKEN", code = 400, message = "Invalid hold authorization token" })
end

-- Validate Server-Side Monotonic Clock
local now = tonumber(ARGV[3])
if expires_at and now >= expires_at then
    return cjson.encode({ error = "HOLD_EXPIRED", code = 409, message = "Reservation hold time has expired" })
end

-- Atomic State Transition
local unit_key = KEYS[1] .. ":" .. unit_id
local new_version = redis.call('HINCRBY', unit_key, 'version', 1)

redis.call('HSET', unit_key, 'status', 'CONFIRMED')
redis.call('HDEL', unit_key, 'expires_at')

redis.call('HMSET', res_key,
    'status', 'CONFIRMED',
    'version', new_version,
    'confirmed_at', ARGV[3]
)

-- Append to Stream
local event_id = redis.call('XADD', KEYS[3], '*',
    'event_type', 'RESERVATION_CONFIRMED',
    'reservation_id', ARGV[1],
    'unit_id', unit_id,
    'version', new_version,
    'occurred_at', ARGV[3]
)

local response = cjson.encode({
    reservationId = ARGV[1],
    unitId = unit_id,
    status = 'CONFIRMED',
    version = new_version,
    confirmedAt = tonumber(ARGV[3]),
    eventId = event_id,
    code = 200
})

if ARGV[4] and ARGV[4] ~= '' then
    redis.call('SETEX', KEYS[4] .. ":" .. ARGV[4], 600, response)
end

return response
`;

export const RELEASE_FCFS_LUA = `
-- KEYS: [1] fifo_queue, [2] unit_prefix, [3] res_prefix, [4] stream_key
-- ARGV: [1] res_id, [2] token_hash, [3] server_now, [4] is_timeout_job

local res_key = KEYS[3] .. ":" .. ARGV[1]
local res_data = redis.call('HMGET', res_key, 'unit_id', 'status', 'token_hash', 'version')

local unit_id = res_data[1]
local current_status = res_data[2]
local expected_token_hash = res_data[3]
local res_version = tonumber(res_data[4]) or 1

if not unit_id or not current_status then
    return cjson.encode({ error = "NOT_FOUND", code = 404, message = "Reservation not found" })
end

-- Terminal state protection: Cannot release already confirmed tickets
if current_status == 'CONFIRMED' then
    return cjson.encode({ error = "ALREADY_CONFIRMED", code = 409, message = "Confirmed reservations cannot be released" })
end

if current_status == 'EXPIRED' or current_status == 'RELEASED' then
    return cjson.encode({ status = current_status, code = 200, message = "Reservation already released or expired" })
end

-- If explicit user cancellation, verify token hash
local is_timeout = (ARGV[4] == '1')
if not is_timeout and expected_token_hash ~= ARGV[2] then
    return cjson.encode({ error = "INVALID_HOLD_TOKEN", code = 400, message = "Invalid hold authorization token" })
end

-- Check unit ownership & Monotonic Version Fence
local unit_key = KEYS[2] .. ":" .. unit_id
local unit_owner = redis.call('HGET', unit_key, 'reservation_id')
local unit_status = redis.call('HGET', unit_key, 'status')

if unit_owner ~= ARGV[1] then
    -- Unit is already reassigned to someone else! Stale release is safe no-op
    redis.call('HSET', res_key, 'status', is_timeout and 'EXPIRED' or 'RELEASED')
    return cjson.encode({ status = "IGNORED_STALE_RELEASE", code = 200, message = "Unit already reassigned to a newer reservation" })
end

-- Return unit to head of FIFO queue for immediate re-allocation (Elastic Re-Queueing)
redis.call('HDEL', unit_key, 'reservation_id', 'token_hash', 'expires_at')
redis.call('HSET', unit_key, 'status', 'AVAILABLE')
local new_unit_version = redis.call('HINCRBY', unit_key, 'version', 1)
redis.call('LPUSH', KEYS[1], unit_id)

local terminal_status = is_timeout and 'EXPIRED' or 'RELEASED'
redis.call('HMSET', res_key, 'status', terminal_status, 'version', res_version + 1)

-- Append to Stream
local event_type = is_timeout and 'HOLD_EXPIRED' or 'HOLD_RELEASED'
local event_id = redis.call('XADD', KEYS[4], '*',
    'event_type', event_type,
    'reservation_id', ARGV[1],
    'unit_id', unit_id,
    'version', res_version + 1,
    'occurred_at', ARGV[3]
)

return cjson.encode({
    reservationId = ARGV[1],
    unitId = unit_id,
    status = terminal_status,
    version = res_version + 1,
    eventId = event_id,
    code = 200
})
`;

// Script SHA cache
const shaCache: Record<string, string> = {};

export async function loadScripts(redis: Redis): Promise<void> {
  const scripts = [
    { name: "adaptive_balance", script: ADAPTIVE_BALANCE_LUA },
    { name: "hold_fcfs", script: HOLD_FCFS_LUA },
    { name: "confirm", script: CONFIRM_LUA },
    { name: "release_fcfs", script: RELEASE_FCFS_LUA },
  ];

  for (const item of scripts) {
    const sha = (await redis.script("LOAD", item.script)) as string;
    shaCache[item.name] = sha;
  }
}

async function evalOrSha(
  redis: Redis,
  name: string,
  script: string,
  numKeys: number,
  keysAndArgs: (string | number)[]
): Promise<any> {
  const sha = shaCache[name];
  if (sha) {
    try {
      return await redis.evalsha(sha, numKeys, ...keysAndArgs);
    } catch (err: any) {
      if (err.message && err.message.includes("NOSCRIPT")) {
        const newSha = (await redis.script("LOAD", script)) as string;
        shaCache[name] = newSha;
        return await redis.evalsha(newSha, numKeys, ...keysAndArgs);
      }
      throw err;
    }
  } else {
    const newSha = (await redis.script("LOAD", script)) as string;
    shaCache[name] = newSha;
    return await redis.evalsha(newSha, numKeys, ...keysAndArgs);
  }
}

// Token hash utility (SHA-256 of raw secret hold token)
export function hashHoldToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateHoldToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

// 1. Adaptive Admission Controller
export async function checkAdaptiveAdmission(
  redis: Redis,
  eventId: string,
  baseCapacity: number = 1000,
  baseRefillRate: number = 500
): Promise<{ admitted: number; reason?: string; code: number; remaining: number }> {
  const queueKey = `ticketwala:event:${eventId}:available_queue`;
  const bucketKey = `ticketwala:event:${eventId}:token_bucket`;
  const nowMs = Date.now();

  const raw = await evalOrSha(
    redis,
    "adaptive_balance",
    ADAPTIVE_BALANCE_LUA,
    2,
    [queueKey, bucketKey, baseCapacity, baseRefillRate, nowMs]
  );
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

// 2. Strict FCFS Hold Claim
export interface ClaimHoldParams {
  eventId: string;
  idempotencyScopeKey: string;
  requestFingerprint: string;
  reservationId: string;
  rawHoldToken: string;
  ttlSeconds: number;
  requestedUnitId?: string;
}

export async function claimHoldFcfs(
  redis: Redis,
  params: ClaimHoldParams
): Promise<any> {
  const queueKey = `ticketwala:event:${params.eventId}:available_queue`;
  const unitPrefix = "ticketwala:unit";
  const resPrefix = "ticketwala:reservation";
  const idempPrefix = "ticketwala:idempotency";
  const streamKey = "ticketwala:events";
  const serverNowSec = Math.floor(Date.now() / 1000);
  const tokenHash = hashHoldToken(params.rawHoldToken);

  const raw = await evalOrSha(
    redis,
    "hold_fcfs",
    HOLD_FCFS_LUA,
    5,
    [
      queueKey,
      unitPrefix,
      resPrefix,
      idempPrefix,
      streamKey,
      params.idempotencyScopeKey,
      params.requestFingerprint,
      params.reservationId,
      tokenHash,
      params.ttlSeconds,
      serverNowSec,
      params.requestedUnitId || "",
    ]
  );

  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

// 3. Confirm Hold
export interface ConfirmHoldParams {
  reservationId: string;
  rawHoldToken: string;
  idempotencyKey?: string;
}

export async function confirmHold(
  redis: Redis,
  params: ConfirmHoldParams
): Promise<any> {
  const unitPrefix = "ticketwala:unit";
  const resPrefix = "ticketwala:reservation";
  const streamKey = "ticketwala:events";
  const idempPrefix = "ticketwala:idempotency";
  const serverNowSec = Math.floor(Date.now() / 1000);
  const tokenHash = hashHoldToken(params.rawHoldToken);

  const raw = await evalOrSha(
    redis,
    "confirm",
    CONFIRM_LUA,
    4,
    [
      unitPrefix,
      resPrefix,
      streamKey,
      idempPrefix,
      params.reservationId,
      tokenHash,
      serverNowSec,
      params.idempotencyKey || "",
    ]
  );

  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

// 4. Release Hold
export interface ReleaseHoldParams {
  eventId: string;
  reservationId: string;
  rawHoldToken?: string;
  isTimeoutJob?: boolean;
}

export async function releaseHold(
  redis: Redis,
  params: ReleaseHoldParams
): Promise<any> {
  const queueKey = `ticketwala:event:${params.eventId}:available_queue`;
  const unitPrefix = "ticketwala:unit";
  const resPrefix = "ticketwala:reservation";
  const streamKey = "ticketwala:events";
  const serverNowSec = Math.floor(Date.now() / 1000);
  const tokenHash = params.rawHoldToken ? hashHoldToken(params.rawHoldToken) : "";
  const isTimeoutFlag = params.isTimeoutJob ? "1" : "0";

  const raw = await evalOrSha(
    redis,
    "release_fcfs",
    RELEASE_FCFS_LUA,
    4,
    [
      queueKey,
      unitPrefix,
      resPrefix,
      streamKey,
      params.reservationId,
      tokenHash,
      serverNowSec,
      isTimeoutFlag,
    ]
  );

  return typeof raw === "string" ? JSON.parse(raw) : raw;
}
