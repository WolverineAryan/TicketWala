-- Event identity must be supplied by every persistence writer. Remove the
-- legacy placeholder defaults so missing identity cannot be stored as evt-main.
ALTER TABLE reservations
    ALTER COLUMN event_id DROP DEFAULT;

ALTER TABLE reservation_events
    ALTER COLUMN event_id_ref DROP DEFAULT;
