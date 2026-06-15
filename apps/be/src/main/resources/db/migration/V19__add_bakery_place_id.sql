ALTER TABLE bakery ADD COLUMN place_id VARCHAR(255);

UPDATE bakery b
SET place_id = (
    SELECT bi.place_id
    FROM bakery_image bi
    WHERE bi.bakery_id = b.id
      AND bi.place_id IS NOT NULL
    LIMIT 1
)
WHERE b.place_id IS NULL
  AND EXISTS (
      SELECT 1 FROM bakery_image bi
      WHERE bi.bakery_id = b.id
        AND bi.place_id IS NOT NULL
  );

-- 같은 place_id가 여러 bakery에 매핑된 경우 id가 작은 행만 남기고 나머지는 NULL 처리
UPDATE bakery b
SET place_id = NULL
WHERE place_id IS NOT NULL
  AND id NOT IN (
      SELECT MIN(id)
      FROM bakery
      WHERE place_id IS NOT NULL
      GROUP BY place_id
  );

CREATE UNIQUE INDEX idx_bakery_place_id ON bakery(place_id) WHERE place_id IS NOT NULL;

ALTER TABLE bakery_image DROP COLUMN IF EXISTS place_id;
