CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE bakery ADD COLUMN location geometry(Point, 4326);

UPDATE bakery SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);

ALTER TABLE bakery ALTER COLUMN location SET NOT NULL;

CREATE INDEX idx_bakery_location ON bakery USING GIST (location);
