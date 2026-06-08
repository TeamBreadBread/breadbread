-- Google Places 동기화 오류: 대전사람 수부씨(서구 변정4길) → 변동
UPDATE bakery
SET dong = '변동'
WHERE id = 21
   OR name = '대전사람 수부씨';
