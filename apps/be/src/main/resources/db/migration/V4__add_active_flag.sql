ALTER TABLE course
ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE post
ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE comment
ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE review
ADD COLUMN active BOOLEAN NOT NULL DEFAULT TRUE;

-- partial indexes: active = true인 row만 포함해 인덱스 크기 최소화
CREATE INDEX idx_course_active ON course (id DESC) WHERE active = true;
CREATE INDEX idx_post_active ON post (created_at DESC, id DESC) WHERE active = true;
CREATE INDEX idx_comment_post_active ON comment (post_id, created_at ASC) WHERE active = true;
CREATE INDEX idx_review_bakery_active ON review (bakery_id, created_at DESC) WHERE active = true;
CREATE INDEX idx_bakery_active ON bakery (id DESC) WHERE active = true;
