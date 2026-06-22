CREATE TABLE comment_image_urls (
    comment_id BIGINT NOT NULL,
    image_url  VARCHAR(2048) NOT NULL
);

ALTER TABLE ONLY comment_image_urls
    ADD CONSTRAINT fk_comment_image_urls_comment
        FOREIGN KEY (comment_id) REFERENCES comment (id);
