# breadbread 백엔드

> 로컬 실행 방법(docker compose, bootRun, Swagger)은 [루트 README](../../README.md)를 참고하세요.

---

## 환경변수 설정

`apps/be` 루트에 `.env` 파일을 생성하거나, IDE의 Run Configuration에 아래 환경변수를 추가한다.

> 필수 항목만 설정하면 나머지는 `application.yml` 기본값으로 동작한다.

```
# JWT
JWT_SECRET=<최소 32자 이상의 랜덤 문자열>
JWT_REFRESH_SECRET=<최소 32자 이상의 랜덤 문자열>

# GCP (로컬에서는 Cloud SQL 없이 직접 JDBC로 접속)
GCP_PROJECT_ID=your-project-id

# GCS (파일 업로드 테스트 시 필요)
GCS_BUCKET=your-bucket-name

# OAuth2 (소셜 로그인 테스트 시 필요)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...

# AI 웹훅 (AI 코스 테스트 시 필요)
AI_COURSE_WEBHOOK_URL=...
AI_CHAT_WEBHOOK_URL=...
AI_CONGESTION_WEBHOOK_URL=...
AI_API_KEY=...

# Portone (결제 테스트 시 필요)
PORTONE_API_SECRET=...
PORTONE_STORE_ID=...
PORTONE_CHANNEL_KEY=...
PORTONE_WEBHOOK_SECRET=...

# CoolSMS (문자 인증 테스트 시 필요)
COOLSMS_API_KEY=...
COOLSMS_API_SECRET=...
COOLSMS_SENDER=01000000000

# Kakao Mobility (경로 계산 테스트 시 필요)
KAKAO_MOBILITY_APP_KEY=...

# Google Places (빵집 사진 조회 시 필요)
GOOGLE_PLACES_API_KEY=...

# Naver Maps (현재 미사용, route.provider=naver 전환 시 필요)
NAVER_MAPS_CLIENT_ID=...
NAVER_MAPS_CLIENT_SECRET=...
```

---

## 환경변수 전체 목록

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `SPRING_PROFILES_ACTIVE` | `local` | 활성 프로파일 |
| `PORT` | `8080` (prod) / `8000` (local 프로파일) | 서버 포트 |
| `DB_HOST` | `localhost` | DB 호스트 |
| `DB_PORT` | `5432` | DB 포트 |
| `DB_NAME` | `breaddb` | DB 이름 |
| `DB_USERNAME` | `bread` | DB 사용자 |
| `DB_PASSWORD` | `bread1234` | DB 비밀번호 |
| `DB_MAX_POOL_SIZE` | `5` | HikariCP 최대 커넥션 수 |
| `DB_MIN_IDLE` | `1` | HikariCP 최소 유휴 커넥션 |
| `DB_CONNECTION_TIMEOUT` | `3000` | 커넥션 획득 타임아웃 (ms) |
| `REDIS_HOST` | `localhost` | Redis 호스트 |
| `REDIS_PORT` | `6379` | Redis 포트 |
| `REDIS_PASSWORD` | _(없음)_ | Redis 비밀번호 |
| `REDIS_TIMEOUT` | `3s` | Redis 응답 타임아웃 |
| `JWT_SECRET` | **필수** | JWT 액세스 토큰 서명 키 |
| `JWT_EXPIRES_IN` | `3600` | 액세스 토큰 유효시간 (초) |
| `JWT_REFRESH_SECRET` | **필수** | JWT 리프레시 토큰 서명 키 |
| `JWT_REFRESH_EXPIRES_IN` | `604800` | 리프레시 토큰 유효시간 (초) |
| `GCP_PROJECT_ID` | `your-project-id` | GCP 프로젝트 ID |
| `GCS_BUCKET` | `your-bucket-name` | GCS 버킷 이름 |
| `GOOGLE_CLIENT_ID` | **필수** | Google OAuth2 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | **필수** | Google OAuth2 클라이언트 시크릿 |
| `NAVER_CLIENT_ID` | **필수** | Naver OAuth2 클라이언트 ID |
| `NAVER_CLIENT_SECRET` | **필수** | Naver OAuth2 클라이언트 시크릿 |
| `KAKAO_CLIENT_ID` | **필수** | Kakao OAuth2 + Kakao Local API 키 |
| `KAKAO_CLIENT_SECRET` | **필수** | Kakao OAuth2 클라이언트 시크릿 |
| `KAKAO_MOBILITY_APP_KEY` | _(없음)_ | Kakao Mobility API 앱 키 |
| `KAKAO_MOBILITY_TIMEOUT_SECONDS` | `10` | Kakao Mobility 요청 타임아웃 |
| `AI_COURSE_WEBHOOK_URL` | **필수** | AI 코스 추천 n8n 웹훅 URL |
| `AI_CHAT_WEBHOOK_URL` | **필수** | AI 챗봇 n8n 웹훅 URL |
| `AI_CONGESTION_WEBHOOK_URL` | **필수** | AI 혼잡도 분석 n8n 웹훅 URL |
| `AI_WEBHOOK_TIMEOUT_SECONDS` | `90` | AI 웹훅 응답 대기 시간 (초) |
| `AI_JOB_TTL_HOURS` | `24` | AI job 상태 Redis TTL (시간) |
| `AI_API_KEY` | **필수** | AI → 백엔드 웹훅 인증 키 |
| `PORTONE_API_BASE_URL` | `https://api.portone.io` | Portone API Base URL |
| `PORTONE_API_SECRET` | _(없음)_ | Portone API 시크릿 |
| `PORTONE_STORE_ID` | _(없음)_ | Portone 스토어 ID |
| `PORTONE_CHANNEL_KEY` | _(없음)_ | Portone 채널 키 |
| `PORTONE_WEBHOOK_SECRET` | _(없음)_ | Portone 웹훅 시크릿 |
| `COOLSMS_API_KEY` | `temp-api-key` | CoolSMS API 키 |
| `COOLSMS_API_SECRET` | `temp-api-secret` | CoolSMS API 시크릿 |
| `COOLSMS_SENDER` | `01000000000` | 문자 발신 번호 |
| `PHONE_CODE_EXPIRES_IN` | `300` | 인증코드 유효시간 (초) |
| `PHONE_TOKEN_EXPIRES_IN` | `600` | 인증 토큰 유효시간 (초) |
| `NAVER_MAPS_CLIENT_ID` | **필수** | Naver Maps API 클라이언트 ID |
| `NAVER_MAPS_CLIENT_SECRET` | **필수** | Naver Maps API 클라이언트 시크릿 |
| `NAVER_MAPS_TIMEOUT_SECONDS` | `10` | Naver Maps 요청 타임아웃 |
| `GOOGLE_PLACES_API_KEY` | **필수** | Google Places API 키 |
| `GOOGLE_PLACES_PHOTO_URL_TTL_SECONDS` | `345600` | 사진 URL 캐시 TTL (초, 기본 4일) |
| `ROUTE_PROVIDER` | `kakao` | 경로 계산 Provider (`naver` 또는 `kakao`) |

---

## Cloud Run 배포

`main` 브랜치 대상 PR이 merge되고 `apps/be/**` 변경이 포함되면 `.github/workflows/cd-cloud-run.yml`이 자동으로 Docker 이미지 빌드 → Artifact Registry 푸시 → Cloud Run 배포까지 처리한다.

### DB 커넥션 수 계획

- Cloud SQL db-f1-micro: `max_connections = 25`
- Cloud Run 최대 인스턴스 × `DB_MAX_POOL_SIZE` ≤ `max_connections`
- 예: `DB_MAX_POOL_SIZE=10`일 때 최대 인스턴스 2 × pool 10 = 커넥션 20개 사용
- `DB_MAX_POOL_SIZE`는 GCP Cloud Run 환경변수에서 관리

---

## DB 마이그레이션 (Flyway)

마이그레이션 파일 위치: `src/main/resources/db/migration/V{n}__*.sql`

**주의사항**
- **이미 적용된 파일은 절대 수정하지 않는다.** 체크섬 불일치로 앱 기동 실패.
- 운영/공유 DB에서는 잘못된 마이그레이션도 새 migration으로 되돌리는 것을 원칙으로 한다.
- 로컬 개발 DB에서만 잘못 적용된 마이그레이션을 되돌려야 한다면:
  1. DB에서 해당 컬럼/테이블을 직접 원복
  2. `DELETE FROM flyway_schema_history WHERE version = 'n';` 실행
  3. 파일 수정 후 재시작

---

## 운영 정책

### Rate Limit

IP 기준으로 엔드포인트별 요청 횟수를 Redis로 제한한다.  
Cloud Run 환경의 `X-Forwarded-For` 헤더에서 클라이언트 IP를 추출 (`client, lb` 포맷 → 끝에서 두 번째).

| 엔드포인트 | 메서드 | 60초당 최대 |
|-----------|--------|------------|
| `/auth/signup`, `/auth/find-id`, `/auth/find-pw`, `/auth/phone/send` | POST | 3회 |
| `/auth/phone/verify`, `/curator/chat`, `/courses/ai`, `/posts` | POST | 5회 |
| `/auth/login`, `/auth/naver/state`, `/images`, `/payments/prepare`, `/payments/complete` | POST | 10회 |
| `/auth/refresh` | POST | 20회 |
| `/courses`, `/bakeries`, `/bakeries/summary`, `/bakeries/ai`, `/trends/breads`, `/trends/bakeries` | GET | 50회 |

초과 시 `429 Too Many Requests` + `Retry-After` 헤더 반환.  
Redis 장애 시 fail-open (요청 허용).

### JWT

- 액세스 토큰: 기본 1시간 (`JWT_EXPIRES_IN`)
- 리프레시 토큰: 기본 7일 (`JWT_REFRESH_EXPIRES_IN`), Redis에 저장

### AI 웹훅 인증

n8n → 백엔드 호출 시 `X-AI-API-KEY` 헤더로 `AI_API_KEY` 검증.  
`AiApiKeyFilter`에서 외부 AI/자동화 서버가 호출하는 엔드포인트를 보호한다.

- `POST/PUT/PATCH/DELETE /admin/congestion/**`
- `POST/PUT/PATCH/DELETE /admin/trends/**`
- `/admin/tours/active/**`
- `POST /notifications/curator/**`

사용자-facing AI 요청(`/curator/chat`, `/courses/ai`)은 JWT 인증과 Rate Limit로 보호한다.

### PortOne 웹훅

- `POST /payments/webhook`은 결제사가 호출해야 하므로 Security 설정에서는 `permitAll`이다.
- 대신 `PaymentService`에서 PortOne 웹훅 서명, 결제 상태, 결제 금액을 검증한 뒤 내부 상태를 변경한다.
- 결제 생성/완료 API(`/payments/prepare`, `/payments/complete`)는 60초당 10회 Rate Limit 대상이다.

### 파일 업로드 제한

- 파일 1개: 최대 10MB
- 요청 전체: 최대 50MB

### CORS

허용 Origin은 `SecurityConfig`에서 관리. 프론트엔드 도메인 변경 시 코드 수정 필요.

---

## 코드 컨벤션

- **Google Java Format (AOSP)** 스타일 적용
- 커밋 전 반드시 포맷 실행: `./gradlew spotlessApply`
- 포맷 미적용 시 CI 빌드 실패

## 테스트

```bash
./gradlew test
```

- 단위 테스트: `@ExtendWith(MockitoExtension.class)` + `@Mock` / `@InjectMocks`
- WebClient mock: `@Mock(answer = Answers.RETURNS_DEEP_STUBS)`
- 엔티티 ID 주입: `ReflectionTestUtils.setField(entity, "id", 1L)`
- 필터 테스트: `AuthRateLimitFilterTest`에서 제한 초과 응답, `Retry-After` 헤더, Cloud Run `X-Forwarded-For` IP 추출을 검증

---

## 관련 문서

- [백엔드 배포 가이드](docs/backend-deployment.md): Cloud Run, Cloud SQL, Redis, GCS, Secret Manager 운영 체크리스트
- [백엔드 보안/운영 정책](docs/backend-security-and-ops.md): JWT, Rate Limit, AI API key, PortOne 웹훅, 파일 업로드 정책
