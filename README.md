# 🍞 BreadBread

## 프로젝트 소개

**BreadBread**는 AI 코스 추천부터 교통편 예약까지, 대전광역시 빵지순례 투어 플랫폼입니다.

- **FE**: React 19 + Tailwind CSS v4 + Zustand, TanStack Router/Query, Vite
- **BE**: Spring Boot 3.5 + Spring Data JPA + PostgreSQL
- **배포**: Cloudflare Pages (FE) / Google Cloud Run (BE) / Cloud SQL (DB)
- **모노레포**: pnpm workspace (`apps/fe`, `apps/be`)

## 주요 기능

| 기능 | 설명 |
|------|------|
| AI 코스 추천 | 취향·예산·이동 수단을 바탕으로 맞춤형 빵집 투어 코스 생성 |
| 빵집 탐색 | 빵집 검색, 필터링, 상세 정보 확인 |
| 빵택시 | 코스에 맞는 택시 예약으로 빵집 투어 바로 시작 |
| 예약 & 결제 | 빵집 예약 및 PortOne을 통한 간편 결제 |
| 소셜 로그인 | Google · Naver · Kakao OAuth2 로그인 |
| 커뮤니티 | 빵집 리뷰 및 투어 후기 공유 |


---

## 아키텍처

<img width="1271" height="1030" alt="아키텍쳐" src="https://github.com/user-attachments/assets/4c4560d3-ca26-4793-8e8a-0d95c2876a96" />

---

## 기술 스택

### Frontend
| 역할 | 라이브러리 |
|---|---|
| UI | React 19 |
| 라우팅 | TanStack Router (파일 기반) |
| 서버 상태 | TanStack Query |
| 클라이언트 상태 | Zustand |
| 스타일 | Tailwind CSS v4 |
| 빌드 | Vite |

### Backend
| 역할 | 라이브러리 |
|---|---|
| 프레임워크 | Spring Boot 3.5 (Java 17) |
| ORM | Spring Data JPA + QueryDSL |
| DB 마이그레이션 | Flyway |
| 캐시 | Redis |
| DB | PostgreSQL |
| API 문서 | SpringDoc OpenAPI (Swagger) |
| 인증 | OAuth2 (소셜 로그인) + JWT |
| 파일 저장 | Google Cloud Storage |

---

## 로컬 개발 환경 세팅

### 공통
```bash
# 레포 클론
git clone https://github.com/TeamBreadBread/breadbread.git
cd breadbread

# 패키지 설치 (루트에서 한 번만)
pnpm install
```

> **주의:** `pnpm install`은 항상 루트(`breadbread/`)에서 실행하세요.
> `apps/fe` 안에서 실행하면 안 됩니다.

### Frontend 실행
```bash
cd apps/fe
pnpm dev
```


### Backend 실행

**1. DB 및 Redis 실행 (Docker 필요)**
```bash
cd apps/be
docker compose up -d
```

**2. 환경변수 설정**
```bash
cp .env.example .env
# .env 파일을 열어 필요한 값 설정
```

**3. 서버 실행**
```bash
./gradlew bootRun
```

- `http://localhost:8080/swagger-ui/index.html`에서 Swagger 문서 확인 가능

---

## 팀원

| 이름 | 역할 |
|------|------|
| 백승훈 | PM |
| 유민진 | PD |
| 이지현 | FE |
| 임지원 | BE |

---

## 관련 문서

- [협업 가이드라인 (CONTRIBUTING.md)](CONTRIBUTING.md) — 브랜치 전략, 커밋 규칙, 협업 방식
- [API 문서](https://api.breadbread.io/swagger-ui/index.html)
