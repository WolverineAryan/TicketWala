import crypto from "crypto";
import type Redis from "ioredis";

export const INVENTORY_CAPACITY = 200;
export const DEFAULT_HOLD_TTL_SECONDS = 120;
export const IDEMPOTENCY_TTL_SECONDS = 600;

export function eventKey(eventId: string, suffix: string): string {
  return `ticketwala:event:{${eventId}}:${suffix}`;
}

export function queueKey(eventId: string): string {
  return eventKey(eventId, "available_queue");
}

export function unitPrefix(eventId: string): string {
  return eventKey(eventId, "unit");
}

export function reservationPrefix(eventId: string): string {
  return eventKey(eventId, "reservation");
}

export function idempotencyPrefix(eventId: string): string {
  return eventKey(eventId, "idempotency");
}

export function inventoryMetaKey(eventId: string): string {
  return eventKey(eventId, "inventory");
}

export function streamKey(eventId: string): string {
  return eventKey(eventId, "events");
}

const ERROR_MESSAGES = {
  SOLD_OUT: "No available inventory units remain",
  IDEMPOTENCY_CONFLICT: "Idempotency key reuse with different parameters",
  NOT_FOUND: "Reservation not found",
  INVALID_HOLD_TOKEN: "Invalid hold authorization token",
  HOLD_EXPIRED: "Reservation hold time has expired or was released",
  ALREADY_CONFIRMED: "Confirmed reservations cannot be released",
  STALE_EXPIRY: "Expiry job is stale and did not change inventory",
} as const;

export const INITIALIZE_INVENTORY_LUA = `
-- KEYS: [1] queue, [2] unit_prefix, [3] membership_set, [4] inventory_meta
-- ARGV: [1] capacity
local capacity = tonumber(ARGV[1])
if not capacity or capacity <= 0 then
  return cjson.encode({ error = "INVALID_CAPACITY", code = 400 })
end

-- Preflight every canonical unit before touching the queue or membership set.
-- A partially populated hash is ambiguous and must never be made available.
local available_units = {}
for i = 1, capacity do
  local width = capacity >= 1000 and 4 or 3
  local unit_id = string.format('unit-%0' .. width .. 'd', i)
  local unit_key = KEYS[2] .. ':' .. unit_id
  local field_count = redis.call('HLEN', unit_key)
  local status = redis.call('HGET', unit_key, 'status')
  local reservation_id = redis.call('HGET', unit_key, 'reservation_id')
  local token_hash = redis.call('HGET', unit_key, 'token_hash')
  local expires_at = redis.call('HGET', unit_key, 'expires_at')
  local event_id = redis.call('HGET', unit_key, 'event_id')
  local version = redis.call('HGET', unit_key, 'version')

  if field_count == 0 then
    -- New units are safe to create during initialization.
    available_units[#available_units + 1] = unit_id
  elseif not version or not tonumber(version) or tonumber(version) < 1 then
    return cjson.encode({ error = "INVENTORY_CORRUPT", code = 409,
      message = "Inventory unit has an invalid version", unitId = unit_id })
  elseif status == 'AVAILABLE' then
    if reservation_id or token_hash or expires_at or event_id then
      return cjson.encode({ error = "INVENTORY_CORRUPT", code = 409,
        message = "Available unit contains ownership fields", unitId = unit_id })
    end
    available_units[#available_units + 1] = unit_id
  elseif status == 'HELD' then
    if not reservation_id or not token_hash or not expires_at then
      return cjson.encode({ error = "INVENTORY_CORRUPT", code = 409,
        message = "Held unit is missing ownership fields", unitId = unit_id })
    end
  elseif status == 'CONFIRMED' then
    if not reservation_id or not token_hash or expires_at then
      return cjson.encode({ error = "INVENTORY_CORRUPT", code = 409,
        message = "Confirmed unit has inconsistent ownership fields", unitId = unit_id })
    end
  else
    return cjson.encode({ error = "INVENTORY_CORRUPT", code = 409,
      message = "Inventory unit has an unknown or missing status", unitId = unit_id })
  end
end

-- Commit the rebuilt available projection only after the complete preflight passes.
redis.call('DEL', KEYS[1], KEYS[3])
for _, unit_id in ipairs(available_units) do
  local unit_key = KEYS[2] .. ':' .. unit_id
  if redis.call('HLEN', unit_key) == 0 then
    redis.call('HMSET', unit_key, 'status', 'AVAILABLE', 'version', '1')
  end
  redis.call('RPUSH', KEYS[1], unit_id)
  redis.call('SADD', KEYS[3], unit_id)
end
redis.call('HSET', KEYS[4], 'capacity', capacity, 'initialized_at', ARGV[2] or '0')
return cjson.encode({ status = "INITIALIZED", capacity = capacity, available = #available_units })
`;

export const ADAPTIVE_BALANCE_LUA = `
-- KEYS: [1] queue, [2] token bucket
-- ARGV: [1] base capacity, [2] refill rate, [3] now milliseconds
local available = redis.call('LLEN', KEYS[1])
if available == 0 then
  return cjson.encode({ admitted = 0, reason = "SOLD_OUT", code = 409, remaining = 0 })
end
local base_cap = tonumber(ARGV[1]) or 1000
local base_rate = tonumber(ARGV[2]) or 500
local now = tonumber(ARGV[3])
local dynamic_cap = math.min(base_cap, math.max(10, available * 2))
local dynamic_rate = math.min(base_rate, math.max(5, available))
local bucket = redis.call('HMGET', KEYS[2], 'tokens', 'last_updated')
local tokens = tonumber(bucket[1]) or dynamic_cap
local last_updated = tonumber(bucket[2]) or now
tokens = math.min(dynamic_cap, tokens + math.max(0, now - last_updated) / 1000 * dynamic_rate)
if tokens < 1 then
  redis.call('HMSET', KEYS[2], 'tokens', tokens, 'last_updated', now)
  return cjson.encode({ admitted = 0, reason = "RATE_LIMITED", code = 429, remaining = available })
end
redis.call('HMSET', KEYS[2], 'tokens', tokens - 1, 'last_updated', now)
return cjson.encode({ admitted = 1, code = 200, remaining = available })
`;

export const HOLD_FCFS_LUA = `
-- KEYS: [1] queue, [2] unit_prefix, [3] reservation_prefix, [4] idempotency_prefix,
--       [5] stream, [6] membership_set
-- ARGV: [1] scoped idempotency key, [2] fingerprint, [3] reservation id,
--       [4] token hash, [5] ttl seconds, [6] server time seconds, [7] event id
local idemp_key = KEYS[4] .. ':' .. ARGV[1]
local cached = redis.call('GET', idemp_key)
if cached then
  local parsed = cjson.decode(cached)
  if parsed.fingerprint ~= ARGV[2] then
    return cjson.encode({ error = "IDEMPOTENCY_CONFLICT", code = 422, message = "${ERROR_MESSAGES.IDEMPOTENCY_CONFLICT}" })
  end
  parsed.idempotentReplay = true
  parsed.holdToken = nil
  return cjson.encode(parsed)
end

local unit_id = redis.call('RPOP', KEYS[1])
if not unit_id then
  return cjson.encode({ error = "SOLD_OUT", code = 409, message = "${ERROR_MESSAGES.SOLD_OUT}" })
end
redis.call('SREM', KEYS[6], unit_id)
local unit_key = KEYS[2] .. ':' .. unit_id
local unit_state = redis.call('HMGET', unit_key, 'status', 'reservation_id', 'version')
if unit_state[1] ~= 'AVAILABLE' or unit_state[2] then
  return cjson.encode({ error = "INVENTORY_CORRUPT", code = 500, message = "Available queue contained a non-available unit" })
end

local expires_at = tonumber(ARGV[6]) + tonumber(ARGV[5])
local version = (tonumber(unit_state[3]) or 0) + 1
local res_key = KEYS[3] .. ':' .. ARGV[3]
redis.call('HMSET', unit_key, 'event_id', ARGV[7], 'status', 'HELD', 'reservation_id', ARGV[3],
  'token_hash', ARGV[4], 'expires_at', expires_at, 'version', version)
redis.call('HMSET', res_key, 'event_id', ARGV[7], 'unit_id', unit_id, 'status', 'HELD',
  'token_hash', ARGV[4], 'expires_at', expires_at, 'version', version, 'created_at', ARGV[6])

local payload = cjson.encode({ expiresAt = expires_at })
local stream_id = redis.call('XADD', KEYS[5], '*', 'event_type', 'HOLD_CREATED',
  'event_id_ref', ARGV[7], 'reservation_id', ARGV[3], 'unit_id', unit_id,
  'version', version, 'occurred_at', ARGV[6], 'payload', payload)
local response = { reservationId = ARGV[3], unitId = unit_id, status = 'HELD',
  expiresAt = expires_at, version = version, eventId = stream_id, fingerprint = ARGV[2] }
redis.call('SETEX', idemp_key, 600, cjson.encode(response))
return cjson.encode(response)
`;

export const CONFIRM_LUA = `
-- KEYS: [1] unit_prefix, [2] reservation_prefix, [3] stream, [4] idempotency_prefix
-- ARGV: [1] reservation id, [2] token hash, [3] server time, [4] idempotency key, [5] event id
local cache_key = ARGV[4] ~= '' and (KEYS[4] .. ':' .. ARGV[4]) or nil
if cache_key then
  local cached = redis.call('GET', cache_key)
  if cached then return cached end
end
local res_key = KEYS[2] .. ':' .. ARGV[1]
local res = redis.call('HMGET', res_key, 'event_id', 'unit_id', 'status', 'token_hash', 'expires_at', 'version')
if not res[2] or not res[3] then
  return cjson.encode({ error = "NOT_FOUND", code = 404, message = "${ERROR_MESSAGES.NOT_FOUND}" })
end
local unit_key = KEYS[1] .. ':' .. res[2]
local unit = redis.call('HMGET', unit_key, 'event_id', 'status', 'reservation_id', 'token_hash', 'version')
local current_version = tonumber(res[6]) or 0
if res[4] ~= ARGV[2] then
  return cjson.encode({ error = "INVALID_HOLD_TOKEN", code = 400, message = "${ERROR_MESSAGES.INVALID_HOLD_TOKEN}" })
end
if res[3] == 'CONFIRMED' then
  if unit[1] ~= res[1] or unit[2] ~= 'CONFIRMED' or unit[3] ~= ARGV[1] or unit[4] ~= ARGV[2] or tonumber(unit[5]) ~= current_version then
    return cjson.encode({ error = "STALE_RESERVATION", code = 409, message = "Reservation no longer owns this unit" })
  end
  return cjson.encode({ reservationId = ARGV[1], unitId = res[2], status = 'CONFIRMED',
    version = current_version, confirmedAt = tonumber(redis.call('HGET', res_key, 'confirmed_at') or ARGV[3]), code = 200 })
end
if res[3] == 'EXPIRED' or res[3] == 'RELEASED' then
  return cjson.encode({ error = "HOLD_EXPIRED", code = 409, message = "${ERROR_MESSAGES.HOLD_EXPIRED}" })
end
if tonumber(res[5]) and tonumber(ARGV[3]) >= tonumber(res[5]) then
  return cjson.encode({ error = "HOLD_EXPIRED", code = 409, message = "${ERROR_MESSAGES.HOLD_EXPIRED}" })
end
if unit[1] ~= res[1] or unit[2] ~= 'HELD' or unit[3] ~= ARGV[1] or unit[4] ~= ARGV[2] or tonumber(unit[5]) ~= current_version then
  return cjson.encode({ error = "STALE_RESERVATION", code = 409, message = "Reservation no longer owns this unit" })
end
local new_version = current_version + 1
redis.call('HMSET', unit_key, 'status', 'CONFIRMED', 'version', new_version)
redis.call('HDEL', unit_key, 'expires_at')
redis.call('HMSET', res_key, 'status', 'CONFIRMED', 'version', new_version, 'confirmed_at', ARGV[3])
local stream_id = redis.call('XADD', KEYS[3], '*', 'event_type', 'RESERVATION_CONFIRMED',
  'event_id_ref', ARGV[5], 'reservation_id', ARGV[1], 'unit_id', res[2],
  'version', new_version, 'occurred_at', ARGV[3], 'payload', cjson.encode({}))
local response = cjson.encode({ reservationId = ARGV[1], unitId = res[2], status = 'CONFIRMED',
  version = new_version, confirmedAt = tonumber(ARGV[3]), eventId = stream_id, code = 200 })
if cache_key then redis.call('SETEX', cache_key, 600, response) end
return response
`;

export const RELEASE_FCFS_LUA = `
-- KEYS: [1] queue, [2] unit_prefix, [3] reservation_prefix, [4] stream, [5] membership_set
-- ARGV: [1] reservation id, [2] token hash, [3] server time, [4] timeout flag, [5] expected version, [6] event id
local res_key = KEYS[3] .. ':' .. ARGV[1]
local res = redis.call('HMGET', res_key, 'event_id', 'unit_id', 'status', 'token_hash', 'version', 'expires_at')
if not res[2] or not res[3] then
  return cjson.encode({ error = "NOT_FOUND", code = 404, message = "${ERROR_MESSAGES.NOT_FOUND}" })
end
if res[3] == 'CONFIRMED' then
  return cjson.encode({ error = "ALREADY_CONFIRMED", code = 409, message = "${ERROR_MESSAGES.ALREADY_CONFIRMED}" })
end
if res[3] == 'EXPIRED' or res[3] == 'RELEASED' then
  return cjson.encode({ reservationId = ARGV[1], unitId = res[2], status = res[3], version = tonumber(res[5]), code = 200 })
end
local is_timeout = ARGV[4] == '1'
if not is_timeout and res[4] ~= ARGV[2] then
  return cjson.encode({ error = "INVALID_HOLD_TOKEN", code = 400, message = "${ERROR_MESSAGES.INVALID_HOLD_TOKEN}" })
end
if not is_timeout and res[6] and tonumber(ARGV[3]) >= tonumber(res[6]) then
  return cjson.encode({ error = "HOLD_EXPIRED", code = 409, message = "${ERROR_MESSAGES.HOLD_EXPIRED}" })
end
if is_timeout and tonumber(ARGV[5]) ~= tonumber(res[5]) then
  return cjson.encode({ status = "IGNORED_STALE_RELEASE", code = 200, message = "${ERROR_MESSAGES.STALE_EXPIRY}" })
end
local unit_key = KEYS[2] .. ':' .. res[2]
local unit = redis.call('HMGET', unit_key, 'event_id', 'status', 'reservation_id', 'version')
if unit[1] ~= res[1] or unit[2] ~= 'HELD' or unit[3] ~= ARGV[1] or tonumber(unit[4]) ~= tonumber(res[5]) then
  return cjson.encode({ status = "IGNORED_STALE_RELEASE", code = 200, message = "${ERROR_MESSAGES.STALE_EXPIRY}" })
end
if is_timeout and (not res[6] or tonumber(ARGV[3]) < tonumber(res[6])) then
  return cjson.encode({ status = "IGNORED_NOT_EXPIRED", code = 200 })
end
local new_version = tonumber(res[5]) + 1
local terminal = is_timeout and 'EXPIRED' or 'RELEASED'
redis.call('HSET', unit_key, 'status', 'AVAILABLE', 'version', new_version)
redis.call('HDEL', unit_key, 'event_id', 'reservation_id', 'token_hash', 'expires_at')
redis.call('HMSET', res_key, 'status', terminal, 'version', new_version)
redis.call('LPUSH', KEYS[1], res[2])
redis.call('SADD', KEYS[5], res[2])
local event_type = is_timeout and 'HOLD_EXPIRED' or 'HOLD_RELEASED'
local stream_id = redis.call('XADD', KEYS[4], '*', 'event_type', event_type, 'event_id_ref', res[1],
  'reservation_id', ARGV[1], 'unit_id', res[2], 'version', new_version,
  'occurred_at', ARGV[3], 'payload', cjson.encode({}))
return cjson.encode({ reservationId = ARGV[1], unitId = res[2], status = terminal,
  version = new_version, eventId = stream_id, code = 200 })
`;

const shaCache: Record<string, string> = {};

export async function loadScripts(redis: Redis): Promise<void> {
  const scripts = [
    ["initialize_inventory", INITIALIZE_INVENTORY_LUA],
    ["adaptive_balance", ADAPTIVE_BALANCE_LUA],
    ["hold_fcfs", HOLD_FCFS_LUA],
    ["confirm", CONFIRM_LUA],
    ["release_fcfs", RELEASE_FCFS_LUA],
  ] as const;
  for (const [name, script] of scripts) {
    shaCache[name] = (await redis.script("LOAD", script)) as string;
  }
}

async function evalOrSha(redis: Redis, name: string, script: string, numKeys: number, args: (string | number)[]): Promise<unknown> {
  const run = (sha: string) => redis.evalsha(sha, numKeys, ...args);
  try {
    if (!shaCache[name]) shaCache[name] = (await redis.script("LOAD", script)) as string;
    return await run(shaCache[name]);
  } catch (err) {
    if (err instanceof Error && err.message.includes("NOSCRIPT")) {
      shaCache[name] = (await redis.script("LOAD", script)) as string;
      return run(shaCache[name]);
    }
    throw err;
  }
}

function parseResult<T>(raw: unknown): T {
  return (typeof raw === "string" ? JSON.parse(raw) : raw) as T;
}

export function hashHoldToken(rawToken: string): string {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

export function generateHoldToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export interface ScriptResult {
  error?: string;
  code?: number;
  message?: string;
  status?: string;
  reservationId?: string;
  unitId?: string;
  version?: number;
  eventId?: string;
  idempotentReplay?: boolean;
  expiresAt?: number;
  confirmedAt?: number;
}

export async function initializeInventory(redis: Redis, eventId: string, capacity = INVENTORY_CAPACITY): Promise<ScriptResult> {
  return parseResult(await evalOrSha(redis, "initialize_inventory", INITIALIZE_INVENTORY_LUA, 4, [
    queueKey(eventId), unitPrefix(eventId), eventKey(eventId, "available_units"),
    inventoryMetaKey(eventId), capacity, Math.floor(Date.now() / 1000),
  ]));
}

export async function checkAdaptiveAdmission(redis: Redis, eventId: string, baseCapacity = 1000, baseRefillRate = 500): Promise<ScriptResult & { admitted: number; remaining: number }> {
  return parseResult(await evalOrSha(redis, "adaptive_balance", ADAPTIVE_BALANCE_LUA, 2, [
    queueKey(eventId), eventKey(eventId, "token_bucket"), baseCapacity, baseRefillRate, Date.now(),
  ]));
}

export interface ClaimHoldParams {
  eventId: string;
  idempotencyScopeKey: string;
  requestFingerprint: string;
  reservationId: string;
  rawHoldToken: string;
  ttlSeconds?: number;
}

export async function claimHoldFcfs(redis: Redis, params: ClaimHoldParams): Promise<ScriptResult> {
  const scope = `${params.eventId}:${params.idempotencyScopeKey}`;
  return parseResult(await evalOrSha(redis, "hold_fcfs", HOLD_FCFS_LUA, 6, [
    queueKey(params.eventId), unitPrefix(params.eventId), reservationPrefix(params.eventId),
    idempotencyPrefix(params.eventId), streamKey(params.eventId), eventKey(params.eventId, "available_units"),
    scope, params.requestFingerprint, params.reservationId, hashHoldToken(params.rawHoldToken),
    params.ttlSeconds ?? DEFAULT_HOLD_TTL_SECONDS, Math.floor(Date.now() / 1000), params.eventId,
  ]));
}

export interface ConfirmHoldParams {
  eventId: string;
  reservationId: string;
  rawHoldToken: string;
  idempotencyKey?: string;
}

export async function confirmHold(redis: Redis, params: ConfirmHoldParams): Promise<ScriptResult> {
  return parseResult(await evalOrSha(redis, "confirm", CONFIRM_LUA, 4, [
    unitPrefix(params.eventId), reservationPrefix(params.eventId), streamKey(params.eventId),
    idempotencyPrefix(params.eventId), params.reservationId, hashHoldToken(params.rawHoldToken),
    Math.floor(Date.now() / 1000), params.idempotencyKey || "", params.eventId,
  ]));
}

export interface ReleaseHoldParams {
  eventId: string;
  reservationId: string;
  rawHoldToken?: string;
  isTimeoutJob?: boolean;
  expectedVersion?: number;
}

export async function releaseHold(redis: Redis, params: ReleaseHoldParams): Promise<ScriptResult> {
  return parseResult(await evalOrSha(redis, "release_fcfs", RELEASE_FCFS_LUA, 5, [
    queueKey(params.eventId), unitPrefix(params.eventId), reservationPrefix(params.eventId),
    streamKey(params.eventId), eventKey(params.eventId, "available_units"), params.reservationId,
    params.rawHoldToken ? hashHoldToken(params.rawHoldToken) : "", Math.floor(Date.now() / 1000),
    params.isTimeoutJob ? "1" : "0", params.expectedVersion ?? 0, params.eventId,
  ]));
}
