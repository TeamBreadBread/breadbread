ALTER TABLE reservation
    DROP CONSTRAINT IF EXISTS reservation_status_check;

ALTER TABLE reservation
    ADD CONSTRAINT reservation_status_check
        CHECK (status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'));
