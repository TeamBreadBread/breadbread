ALTER TABLE bakery_report
    ADD COLUMN target_bakery_id BIGINT,
    ADD COLUMN menu_name VARCHAR(120),
    ADD COLUMN menu_description VARCHAR(500);
