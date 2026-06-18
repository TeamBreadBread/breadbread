ALTER TABLE public.users
    ADD COLUMN deleted_at timestamp(6) without time zone;

ALTER TABLE public.users
    DROP COLUMN active;
