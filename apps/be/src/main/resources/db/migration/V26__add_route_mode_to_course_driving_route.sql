ALTER TABLE course_driving_route
    ADD COLUMN route_mode VARCHAR(20) NOT NULL DEFAULT 'DRIVING';

ALTER TABLE course_driving_route
    DROP CONSTRAINT course_driving_route_pkey;

ALTER TABLE course_driving_route
    ADD PRIMARY KEY (course_id, route_mode);
