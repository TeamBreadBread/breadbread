ALTER TABLE course_driving_route
    ADD COLUMN total_travel_seconds INTEGER,
    ADD COLUMN leg_durations        TEXT;

ALTER TABLE bakery
    ADD COLUMN estimated_stay_minutes INT NOT NULL DEFAULT 20;

UPDATE bakery
SET estimated_stay_minutes = 40
WHERE drink_available = true;

ALTER TABLE course
    ADD COLUMN total_minutes INTEGER;
