ALTER TABLE bakery
    DROP CONSTRAINT IF EXISTS bakery_frequency_check;

ALTER TABLE bakery
    ADD CONSTRAINT bakery_frequency_check CHECK (
        frequency IS NULL OR
        frequency::text = ANY (ARRAY[
            'ALWAYS',
            'ONCE_PER_DAY',
            'TWICE_PER_DAY',
            'TWO_TO_THREE_PER_WEEK',
            'ONE_TO_TWO_PER_WEEK',
            'ONCE_PER_WEEK',
            'TWO_TO_THREE_PER_MONTH',
            'TWICE_PER_MONTH',
            'ONE_TO_TWO_PER_MONTH',
            'ONCE_PER_MONTH'
        ]::text[])
    );
