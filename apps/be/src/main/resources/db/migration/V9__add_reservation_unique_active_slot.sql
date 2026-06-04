CREATE UNIQUE INDEX ux_reservation_user_slot_active
    ON reservation (user_id, departure_date, departure_time)
    WHERE active = true AND status IN ('PENDING', 'CONFIRMED', 'IN_PROGRESS');
