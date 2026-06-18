-- Course 엔티티에 UserPreference 스냅샷 컬럼/테이블 추가
-- user_preference_id FK 제거로 탈퇴 시 UserPreference 안전하게 삭제 가능

ALTER TABLE course ADD COLUMN snapshot_waiting_tolerance VARCHAR(50);

CREATE TABLE course_pref_bakery_types
(
    course_id   BIGINT      NOT NULL REFERENCES course (id),
    bakery_type VARCHAR(50) NOT NULL
);

CREATE TABLE course_pref_bakery_moods
(
    course_id   BIGINT      NOT NULL REFERENCES course (id),
    bakery_mood VARCHAR(50) NOT NULL
);

CREATE TABLE course_pref_use_types
(
    course_id BIGINT      NOT NULL REFERENCES course (id),
    use_type  VARCHAR(50) NOT NULL
);

-- 기존 데이터 마이그레이션
UPDATE course c
SET snapshot_waiting_tolerance = up.waiting_tolerance
FROM user_preference up
WHERE c.user_preference_id = up.id;

INSERT INTO course_pref_bakery_types (course_id, bakery_type)
SELECT c.id, ubt.bakery_types
FROM course c
         JOIN user_bakery_types ubt ON ubt.preference_id = c.user_preference_id
WHERE c.user_preference_id IS NOT NULL;

INSERT INTO course_pref_bakery_moods (course_id, bakery_mood)
SELECT c.id, ubm.bakery_moods
FROM course c
         JOIN user_bakery_moods ubm ON ubm.preference_id = c.user_preference_id
WHERE c.user_preference_id IS NOT NULL;

INSERT INTO course_pref_use_types (course_id, use_type)
SELECT c.id, uut.bakery_use_types
FROM course c
         JOIN user_use_types uut ON uut.preference_id = c.user_preference_id
WHERE c.user_preference_id IS NOT NULL;

-- FK 컬럼 제거
ALTER TABLE course DROP COLUMN user_preference_id;
