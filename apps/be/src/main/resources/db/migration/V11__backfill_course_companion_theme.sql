-- 운영자 수동 코스에 동행 테마(데이트/가족/친구/혼자) 값을 채웁니다.
UPDATE course
SET theme = '혼자'
WHERE course_type = 'MANUAL'
  AND active = true
  AND shared = true
  AND (
    name LIKE '%숨은 카페%'
    OR name LIKE '%디저트 로드%'
    OR name LIKE '%디저트 삼중주%'
    OR name LIKE '%퓨전%'
  );

UPDATE course
SET theme = '데이트'
WHERE course_type = 'MANUAL'
  AND active = true
  AND shared = true
  AND theme IS NULL
  AND (
    name LIKE '%카페·%'
    OR name LIKE '%카페거리%'
    OR name LIKE '%케이크 거리%'
  );

UPDATE course
SET theme = '가족'
WHERE course_type = 'MANUAL'
  AND active = true
  AND shared = true
  AND theme IS NULL
  AND (
    name LIKE '%성심당%'
    OR name LIKE '%온천%'
    OR name LIKE '%구움과자%'
  );

UPDATE course
SET theme = '친구'
WHERE course_type = 'MANUAL'
  AND active = true
  AND shared = true
  AND theme IS NULL
  AND (
    name LIKE '%트렌디%'
    OR name LIKE '%로컬%'
    OR name LIKE '%둔산%'
  );
