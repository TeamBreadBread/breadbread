# Backend Security and Operations Policy

> 범위: 백엔드 인증, 인가, Rate Limit, 웹훅, 파일 업로드, 외부 API 운영 정책

---

## 1. 기본 원칙

백엔드 보안은 Cloud Run 접근 제어 하나에 의존하지 않는다. Cloud Run 서비스는 공개되어 있지만, 요청의 성격에 따라 애플리케이션 레벨에서 별도 검증을 수행한다.

- 일반 사용자 요청: JWT 인증
- 관리자 요청: JWT 인증 + `ROLE_ADMIN`
- AI/자동화 서버 요청: `X-AI-API-KEY`
- GCP Cloud Scheduler 요청: OIDC 토큰 검증
- PortOne 웹훅: PortOne 서명 검증 + 원격 결제 상태 재조회
- 과도한 요청: IP 기반 Rate Limit

---

## 2. Security Filter 책임

필터는 실행 위치에 따라 책임을 나눈다.

| 필터 | 등록 방식 | 책임 |
|------|-----------|------|
| `MdcLoggingFilter` | Servlet Filter | 모든 요청에 requestId, userId 로깅 컨텍스트 부여 |
| `AuthRateLimitFilter` | Security Chain | 인증/결제/AI/무거운 조회 요청의 호출 빈도 제한 |
| `JwtAuthenticationFilter` | Security Chain | Bearer token 검증 및 사용자 인증 |
| `AiApiKeyFilter` | Security Chain | n8n 등 외부 자동화 서버의 API key 검증 |
| `SchedulerOidcFilter` | Security Chain | GCP Cloud Scheduler가 호출하는 `/scheduler/**`의 OIDC 토큰 검증 |

`AuthRateLimitFilter`는 Bean으로 관리하되 `FilterRegistrationBean#setEnabled(false)`로 서블릿 자동 등록을 끄고 Security Chain에만 등록한다. 이 방식은 필터 중복 실행으로 카운트가 두 번 증가하는 문제를 막기 위한 것이다.

---

## 3. JWT 정책

액세스 토큰은 짧게, 리프레시 토큰은 Redis에 저장해서 서버 측 폐기 가능성을 남긴다.

- Access Token: 기본 1시간
- Refresh Token: 기본 7일
- Refresh Token 저장소: Redis

운영 시 확인할 것:

- `JWT_SECRET`, `JWT_REFRESH_SECRET`은 서로 다른 값 사용
- 두 secret 모두 충분히 긴 랜덤 문자열 사용
- secret 변경 시 기존 토큰이 무효화되는 것을 배포 공지나 장애 대응에 반영

---

## 4. Rate Limit 정책

Rate Limit은 인증 API, 외부 비용이 발생하는 API, 도배 가능성이 있는 API, DB 부하가 큰 조회 API에 적용한다.

현재 정책의 목적:

- 인증 API: brute force와 인증번호 남발 방지
- AI API: n8n 호출 비용과 서버 리소스 보호
- 이미지/결제 API: 외부 저장소, 결제 시스템 연동 지점 보호
- 게시글 작성: 도배 방지
- 조회 API: 무거운 검색/추천/통계성 조회의 반복 호출 완화

운영 기준:

- Redis 장애 시 fail-open으로 요청을 허용한다.
- 제한 초과 시 `429 Too Many Requests`와 `Retry-After` 헤더를 반환한다.
- Cloud Run 환경에서는 `X-Forwarded-For`의 끝에서 두 번째 IP를 클라이언트 IP로 사용한다.

주의할 점:

- IP 기반 제한은 NAT 환경의 정상 사용자를 함께 제한할 수 있다.
- 로그인 이후 사용자 단위 제한이 필요한 API는 추후 userId 기반 key를 검토한다.
- Redis의 `INCR`와 `EXPIRE`가 분리되어 있으면 극히 드문 TTL 누락 가능성이 있다. 운영 중요도가 커지면 Lua script로 원자화한다.

---

## 5. AI API Key 정책

`AiApiKeyFilter`는 일반 사용자가 호출하는 AI 요청이 아니라, 외부 자동화 서버가 백엔드로 다시 호출하는 관리성 엔드포인트를 보호한다.

검증 방식:

- 요청 헤더: `X-AI-API-KEY`
- 비교 대상: `AI_API_KEY`
- 성공 시 `ROLE_ADMIN` 권한을 가진 내부 인증 객체 생성

운영 시 확인할 것:

- n8n과 Cloud Run의 `AI_API_KEY` 값이 일치하는지 확인
- 키 변경 시 n8n workflow와 Secret Manager를 함께 변경
- 사용자-facing AI API는 JWT와 Rate Limit로 보호하고, AI API key 요구 대상으로 섞지 않는다.

---

## 6. Cloud Scheduler OIDC 정책

`SchedulerOidcFilter`는 `@Scheduled` 대신 GCP Cloud Scheduler가 HTTP로 호출하는 `/scheduler/**` 엔드포인트를 보호한다. Cloud Run이 min instances = 0으로 내려가도 Cloud Scheduler가 깨울 수 있도록 하기 위한 구조다.

검증 방식:

- 요청 헤더: `Authorization: Bearer {OIDC 토큰}`
- 토큰 발급자(`issuer`)가 Google인지 `JwtDecoder`로 서명/만료 검증
- 토큰의 `email` 클레임이 `SCHEDULER_SERVICE_ACCOUNT`와 일치하는지 확인
- 토큰의 `aud` 클레임이 `SCHEDULER_AUDIENCE`(Cloud Run 서비스 URL)와 일치하는지 확인 (토큰 재사용 방지)
- 성공 시 `ROLE_ADMIN` 권한을 가진 내부 인증 객체 생성

운영 시 확인할 것:

- Cloud Scheduler 잡의 OIDC 서비스 계정이 `SCHEDULER_SERVICE_ACCOUNT`와 동일한지 확인
- 해당 서비스 계정에 Cloud Run Invoker 역할이 부여되어 있는지 확인
- `SCHEDULER_AUDIENCE`는 Cloud Run 서비스 URL이 바뀌지 않는 한 고정값
- 각 스케줄러 엔드포인트는 `@SchedulerLock`으로 다중 인스턴스 중복 실행을 막는다

---

## 7. PortOne 웹훅 정책

`POST /payments/webhook`은 외부 결제사가 호출해야 하므로 Security 설정에서는 `permitAll`이다. 대신 서비스 계층에서 요청의 신뢰성을 검증한다.

검증 단계:

1. PortOne 웹훅 서명 검증
2. 내부 결제 정보 조회
3. PortOne API로 원격 결제 상태 재조회
4. 결제 금액과 상태 일치 여부 확인
5. 내부 결제 상태 변경

운영 시 확인할 것:

- `PORTONE_WEBHOOK_SECRET`이 PortOne 콘솔 설정과 일치하는지 확인
- 웹훅은 중복 호출될 수 있으므로 멱등성을 고려
- 결제 상태 변경은 서명만 믿지 말고 원격 상태와 금액을 함께 검증

---

## 8. 파일 업로드 정책

파일 업로드는 저장소 비용과 보안 위험이 모두 있는 기능이므로 크기 제한과 소유권 검증을 함께 둔다.

현재 제한:

- 파일 1개 최대 10MB
- 요청 전체 최대 50MB

운영 정책:

- 업로드 직후 이미지는 임시 이미지로 기록
- 도메인 저장 시 현재 사용자가 업로드한 이미지인지 확인
- 기대한 도메인 폴더의 이미지인지 확인
- 사용 확정된 이미지는 임시 목록에서 제거
- 만료된 임시 이미지는 스케줄러로 정리

추가로 고려할 수 있는 것:

- 허용 MIME type 제한
- 이미지 리사이징 또는 압축
- 악성 파일 스캔
- 사용자별 업로드 빈도 제한

---

## 9. CORS 정책

CORS 허용 Origin은 `SecurityConfig`에서 관리한다. 운영 프론트엔드 도메인이 추가되거나 변경되면 코드 변경과 배포가 필요하다.

운영 시 확인할 것:

- `localhost` origin은 개발용으로만 사용
- 운영 도메인 변경 시 OAuth redirect URI도 함께 확인
- credential 허용 상태에서 wildcard origin을 사용하지 않음

---

## 10. 로그 수집 및 모니터링

### 구조화 로그

`logstash-logback-encoder`를 사용해 모든 애플리케이션 로그를 JSON 형식으로 출력한다. Cloud Run 환경에서 stdout으로 출력된 JSON 로그는 GCP Cloud Logging으로 자동 수집된다.

각 요청에는 `MdcLoggingFilter`가 `requestId`와 `userId`를 MDC에 주입해 로그에 포함시킨다. 이를 통해 Cloud Logging에서 특정 요청의 전체 흐름을 추적할 수 있다.

### Grafana 대시보드

GCP Cloud Run 메트릭을 Grafana와 연동해 아래 지표를 실시간으로 모니터링한다.

- 요청 수 / 요청 지연 시간 (p50, p95, p99)
- 컨테이너 인스턴스 수 (오토스케일링 현황)
- 4xx / 5xx 에러율

대시보드: [Grafana 실시간 모니터링](https://livelysamosa206.grafana.net/public-dashboards/fd40ccf21ed84237ae3fe1037a073b51)

---

## 11. 운영 체크리스트

우선순위 높게 볼 로그:

- `401`, `403` 급증: 토큰, role, API key, CORS 설정 확인
- `429` 급증: 특정 IP 또는 API abuse 여부 확인
- `5xx` 급증: DB, Redis, 외부 API timeout 확인
- 결제 웹훅 실패: PortOne secret, 서명 헤더, 원격 결제 상태 확인
- AI 요청 실패: n8n webhook URL, timeout, `AI_API_KEY` 확인
- 스케줄러 동작 누락: Cloud Scheduler 잡 실행 이력, `SCHEDULER_SERVICE_ACCOUNT`/`SCHEDULER_AUDIENCE` 일치 여부 확인
- `/scheduler/bakery-sync-kakao` 502: 카카오 로컬 API 키 누락, 쿼터 초과, API 장애 등으로 전체 동기화 호출이 실패한 경우. 개별 빵집 매칭 실패는 `skipped`로 집계되고 200 + WARN 로그로만 남음

운영 지표로 확장하면 좋은 것:

- API별 4xx/5xx 비율
- Rate Limit 차단 횟수
- Redis command 실패 횟수
- 외부 API timeout 횟수
- 이미지 업로드 실패 및 임시 이미지 정리 건수
