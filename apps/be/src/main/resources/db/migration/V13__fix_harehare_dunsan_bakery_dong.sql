-- Google Places 동기화 오류: 하레하레 둔산점(서구 둔산로) → 둔산동
UPDATE bakery
SET dong = '둔산동'
WHERE id = 17
   OR name = '하레하레 둔산점';
