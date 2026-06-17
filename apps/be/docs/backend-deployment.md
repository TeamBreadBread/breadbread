# Backend Deployment Guide

> 범위: 백엔드 운영 배포 시 확인해야 할 Cloud Run, Cloud SQL, Redis, GCS, Secret Manager 체크포인트

---

## 1. 배포 흐름

백엔드는 GitHub Actions의 `.github/workflows/cd-cloud-run.yml`을 통해 배포된다.

배포 트리거:

- `main` 브랜치를 대상으로 한 PR이 merge됨
- 변경 경로에 `apps/be/**`가 포함됨

배포 단계:

1. Workload Identity Federation으로 GCP 인증
2. `apps/be` Docker 이미지 빌드
3. Artifact Registry에 `${github.sha}` 태그와 `latest` 태그 push
4. Cloud Run 서비스 `breadbread-be`에 새 이미지 배포
5. Cloud SQL 인스턴스 연결, 환경변수, Secret Manager 값 주입

---

## 2. 배포 전 체크리스트

배포 전에는 코드가 빌드되는지만 보지 말고 운영 의존성까지 함께 확인한다.

- Flyway migration이 필요한 엔티티 변경인지 확인
- 이미 적용된 migration 파일을 수정하지 않았는지 확인
- Secret Manager에 새 환경변수 secret이 등록되어 있는지 확인
- `.github/workflows/cd-cloud-run.yml`의 `env_vars` 또는 `secrets`에 새 값이 연결되어 있는지 확인
- Cloud Run 최대 인스턴스와 `DB_MAX_POOL_SIZE`의 곱이 Cloud SQL `max_connections`를 넘지 않는지 확인
- 외부 API 키 변경 시 n8n, PortOne, CoolSMS, Kakao, Google Places 쪽 설정도 같이 확인

---

## 3. Cloud Run 설정 포인트

현재 배포는 `google-github-actions/deploy-cloudrun@v2`를 사용한다.

운영에서 중요한 Cloud Run 옵션:

- `--allow-unauthenticated`: 프론트엔드와 외부 웹훅이 접근해야 하므로 서비스 자체는 공개
- `--add-cloudsql-instances`: Cloud SQL Socket Factory 연결에 필요
- `--cpu-boost`: 콜드 스타트와 초기 부팅 지연 완화
- `SPRING_PROFILES_ACTIVE=prod`: 운영 프로파일 사용

Cloud Run 서비스가 공개되어 있어도 모든 API가 공개되는 것은 아니다. 실제 인증과 인가는 Spring Security, JWT, AI API key, PortOne webhook 검증에서 처리한다.

---

## 4. Cloud SQL 연결

운영 프로파일은 TCP host가 아니라 Cloud SQL Socket Factory 방식으로 PostgreSQL에 연결한다.

필수 값:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `CLOUD_SQL_INSTANCE`
- `DB_NAME`
- `DB_USERNAME`
- `DB_PASSWORD`

운영 DB는 `spring.jpa.hibernate.ddl-auto=validate`로 동작한다. 따라서 JPA 엔티티와 실제 스키마가 맞지 않으면 애플리케이션이 시작되지 않는다.

운영 배포 전 확인할 것:

- 새 엔티티, 새 컬럼, enum 변경에 대한 Flyway migration 존재 여부
- `NOT NULL`, `UNIQUE`, FK 제약이 엔티티 관계와 일치하는지 여부
- migration이 운영 데이터에 대해 안전한 순서인지 여부

---

## 5. DB 커넥션 계획

Cloud Run은 인스턴스가 자동으로 늘어날 수 있으므로 커넥션 수를 인스턴스 단위로 계산해야 한다.

계산식:

```text
최대 DB 커넥션 사용량 = Cloud Run 최대 인스턴스 수 * DB_MAX_POOL_SIZE
```

예시:

```text
Cloud Run 최대 인스턴스 2
DB_MAX_POOL_SIZE 10
예상 최대 커넥션 20
```

Cloud SQL 사양이 작을수록 `DB_MAX_POOL_SIZE`를 보수적으로 잡는다. 커넥션 부족이 발생하면 요청 지연, Hikari timeout, 애플리케이션 부팅 실패로 이어질 수 있다.

---

## 6. Redis 운영 포인트

Redis는 다음 기능에 사용된다.

- refresh token 저장
- 휴대폰 인증코드와 인증 토큰 저장
- AI job 상태 저장
- Rate Limit 카운터 저장

Redis 장애 시 영향:

- refresh token 검증 실패 가능
- 휴대폰 인증 흐름 실패 가능
- AI 작업 상태 조회 실패 가능
- Rate Limit은 fail-open 정책으로 요청을 허용

장애 확인 순서:

1. Cloud Run 로그에서 Redis connection timeout 여부 확인
2. `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` Secret 연결 확인
3. Redis 인스턴스 네트워크 접근 가능 여부 확인
4. Redis timeout이 너무 짧지 않은지 확인

---

## 7. GCS 운영 포인트

GCS는 이미지 업로드 파일 저장소로 사용된다.

필수 값:

- `GCP_PROJECT_ID`
- `GCS_BUCKET`

운영 확인 사항:

- Cloud Run 서비스 계정에 GCS object read/write 권한이 있는지 확인
- 업로드된 이미지는 도메인 저장 전까지 임시 이미지로 관리되는지 확인
- 미사용 임시 이미지 정리 스케줄러가 정상 동작하는지 확인
- 버킷 공개 정책 또는 서명 URL 정책이 의도한 접근 범위와 맞는지 확인

---

## 8. 배포 후 확인

배포가 끝난 뒤에는 최소한 다음을 확인한다.

- Cloud Run revision이 새 이미지 태그로 올라왔는지
- `/actuator/health`가 정상 응답하는지
- 애플리케이션 로그에 Flyway, DB, Redis, GCS 초기화 오류가 없는지
- 로그인 또는 토큰 갱신이 정상 동작하는지
- 이미지 업로드, AI 요청, 결제 준비처럼 외부 의존성이 있는 대표 API가 정상 동작하는지

문제가 있으면 이전 Cloud Run revision으로 rollback한 뒤 로그와 Secret 연결 상태를 확인한다.

