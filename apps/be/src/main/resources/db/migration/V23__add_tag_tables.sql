-- bakery_tag: 리뷰/게시글에서 빵집에 붙인 선택형 태그
CREATE TABLE bakery_tag (
    id              BIGSERIAL PRIMARY KEY,
    bakery_id       BIGINT       NOT NULL REFERENCES bakery (id),
    tag             VARCHAR(50)  NOT NULL,
    source_type     VARCHAR(10)  NOT NULL CHECK (source_type IN ('POST', 'REVIEW')),
    source_id       BIGINT       NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT now(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT now()
);

CREATE INDEX idx_bakery_tag_bakery_id ON bakery_tag (bakery_id);
CREATE INDEX idx_bakery_tag_source ON bakery_tag (source_type, source_id);

-- bread_tag: 리뷰에서 메뉴에 붙인 선택형 태그
CREATE TABLE bread_tag (
    id          BIGSERIAL PRIMARY KEY,
    bread_id    BIGINT      NOT NULL REFERENCES bread (id),
    review_id   BIGINT      NOT NULL REFERENCES review (id),
    tag         VARCHAR(50) NOT NULL,
    created_at  TIMESTAMP   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX idx_bread_tag_bread_id ON bread_tag (bread_id);
CREATE INDEX idx_bread_tag_review_id ON bread_tag (review_id);

-- post에 bakery 연결 (게시판 글 작성 시 빵집 선택, optional)
ALTER TABLE post ADD COLUMN bakery_id BIGINT REFERENCES bakery (id);
