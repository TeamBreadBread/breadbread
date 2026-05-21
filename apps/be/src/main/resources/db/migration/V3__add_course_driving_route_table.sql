CREATE TABLE course_driving_route (
    course_id BIGINT PRIMARY KEY,
    path      TEXT NOT NULL,
    CONSTRAINT fk_course_driving_route_course
        FOREIGN KEY (course_id) REFERENCES course (id) ON DELETE CASCADE
);
