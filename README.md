# 🍞 BreadBread

## 프로젝트 소개

**BreadBread**는 AI 코스 추천부터 빵택시 예약·실시간 투어 안내까지, 대전광역시 빵지순례 투어 플랫폼입니다.

- **FE**: React 19 + Tailwind CSS v4 + TanStack Router + Vite
- **BE**: Spring Boot 3.5 + Spring Data JPA + PostgreSQL
- **배포**: Cloudflare Pages (FE) / Google Cloud Run (BE) / Cloud SQL (DB)
- **모노레포**: pnpm workspace (`apps/fe`) + Gradle (`apps/be`)

## 주요 기능

| 기능 | 설명 |
|------|------|
| AI 코스 추천 | 취향·예산·출발지를 바탕으로 맞춤형 빵집 투어 코스 생성 |
| 빵집 탐색 | 빵집 검색, 필터링, 상세 정보·리뷰 확인 |
| 코스 카탈로그 | 지역별 / 유형별 / 에디터픽 / 테마별 추천 코스 |
| 예약 & 결제 | 빵택시 예약 및 PortOne을 통한 간편 결제 |
| 실시간 투어 | 코스 안내, 혼잡도 알림, FCM 푸시 |
| AI 큐레이터 | BreadBot 챗봇 (코스 변경·예약 취소 등 액션 버튼) |
| 소셜 로그인 | Google · Naver · Kakao OAuth2 로그인 |
| 커뮤니티 | 빵집 리뷰 및 투어 후기 공유 |

---

## 아키텍처

<img width="1271" height="1030" alt="아키텍쳐" src="https://github.com/user-attachments/assets/4c4560d3-ca26-4793-8e8a-0d95c2876a96" />

---

## 레포 구조

```
breadbread/
├── apps/
│   ├── fe/          # React SPA (pnpm)
│   └── be/          # Spring Boot API (Gradle)
├── .github/workflows/
│   ├── ci.yml                   # PR: FE lint/tsc, BE spotless/build/test
│   ├── cd-firebase-hosting.yml  # (선택) main: FE → Firebase Hosting, Secrets 없으면 skip
│   └── cd-cloud-run.yml         # main: BE → Cloud Run
├── package.json     # 루트 스크립트, husky, lint-staged
└── pnpm-workspace.yaml
```

> **참고:** BE는 pnpm 패키지가 아닙니다. Java/Gradle로 빌드·실행합니다.

---

## 기술 스택

### Frontend

| 역할 | 라이브러리 / 방식 |
|---|---|
| UI | React 19 |
| 라우팅 | TanStack Router (파일 기반, `src/routes/`) |
| HTTP | Axios (`src/api/`) |
| 서버 데이터 | 커스텀 훅 · Route loader prefetch (`useBakeries` 등) |
| 클라이언트 상태 | React Context · `localStorage` (JWT 세션) |
| 지도 | Kakao Map SDK · Kakao Mobility 보행 길찾기 |
| 푸시 | Firebase Cloud Messaging (PWA) |
| 스타일 | Tailwind CSS v4 |
| 빌드 | Vite · vite-plugin-pwa |

TanStack Query는 Provider가 구성되어 있으며, 점진적으로 데이터 fetching 패턴을 통일할 예정입니다.

### Backend

| 역할 | 라이브러리 |
|---|---|
| 프레임워크 | Spring Boot 3.5 (Java 17) |
| ORM | Spring Data JPA + QueryDSL |
| DB 마이그레이션 | Flyway |
| 캐시 · 세션 | Redis |
| DB | PostgreSQL |
| API 문서 | SpringDoc OpenAPI + Scalar UI |
| 인증 | OAuth2 (소셜 로그인) + JWT |
| 파일 저장 | Google Cloud Storage |
| 외부 연동 | n8n (AI), PortOne (결제), CoolSMS, FCM |

---

## 로컬 개발 환경 세팅

### 공통

```bash
# 레포 클론
git clone https://github.com/TeamBreadBread/breadbread.git
cd breadbread

# FE 의존성 설치 (루트에서 한 번만)
pnpm install
```

> **주의:** `pnpm install`은 항상 루트(`breadbread/`)에서 실행하세요.  
> `apps/fe` 안에서 실행하면 workspace 의존성이 맞지 않을 수 있습니다.

### Frontend 실행

```bash
# 환경 변수 (최초 1회)
cp apps/fe/.env.example apps/fe/.env.local
# .env.local 에 카카오 REST API 키 등 설정

# 개발 서버 (포트 3000)
pnpm --filter fe dev
```

기본적으로 Vite dev proxy가 `https://api.breadbread.io`로 API를 프록시합니다.  
로컬 BE(`localhost:8080`)를 쓰려면 `apps/fe/.env.local`에 다음을 설정하세요.

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Backend 실행

**1. DB 및 Redis 실행 (Docker 필요)**

```bash
cd apps/be
docker compose up -d
```

**2. 환경 변수 설정**

```bash
cp .env.example .env
# .env 파일을 열어 필요한 값 설정
```

**3. 서버 실행**

```bash
./gradlew bootRun
```

- API 문서: [http://localhost:8000/api-docs.html](http://localhost:8000/api-docs.html) (local 프로파일 기본 포트)

---

## 루트 스크립트

| 명령 | 설명 |
|---|---|
| `pnpm lint:fe` | FE ESLint |
| `pnpm typecheck:fe` | FE TypeScript 검사 |
| `pnpm build` | FE 프로덕션 빌드 |
| `pnpm --filter fe dev` | FE 개발 서버 |
| `cd apps/be && ./gradlew bootRun` | BE 로컬 실행 |
| `cd apps/be && ./gradlew test` | BE 단위 테스트 |
| `cd apps/be && ./gradlew spotlessApply` | BE Java 포맷 |

---

## CI / CD

| 워크플로 | 트리거 | 내용 |
|---|---|---|
| `ci.yml` | PR → `main` | FE lint · tsc, BE spotless · build · unit test |
| Cloudflare Pages | push → `main` (`apps/fe/**`) | FE 빌드 후 Cloudflare Pages 배포 (Git 연동) |
| `cd-firebase-hosting.yml` | push → `main` (선택) | Firebase Hosting — Secrets 없으면 skip |
| `cd-cloud-run.yml` | push → `main` (`apps/be/**`) | BE Docker 이미지 빌드 후 Cloud Run 배포 |

FE 배포 시 필요한 GitHub Secrets는 [apps/fe/DEPLOY.md](apps/fe/DEPLOY.md)를 참고하세요.

BE 배포 시 필요한 환경 변수 및 인프라 설정은 [apps/be/docs/backend-deployment.md](apps/be/docs/backend-deployment.md)를 참고하세요.

- 📊 [실시간 모니터링 대시보드 (Grafana)](https://livelysamosa206.grafana.net/public-dashboards/fd40ccf21ed84237ae3fe1037a073b51) — Cloud Run 요청 수, 레이턴시, 인스턴스 수, 리소스 사용량 등

---

## 팀원

| 이름 | 역할 |
|------|------|
| 백승훈 | PM |
| 유민진 | PD |
| 이지현 | FE, AI |
| 임지원 | BE, Infra |

---

## 관련 문서

- [협업 가이드라인 (CONTRIBUTING.md)](CONTRIBUTING.md) — 브랜치 전략, 커밋 규칙, 협업 방식
- [FE 배포 가이드 (apps/fe/DEPLOY.md)](apps/fe/DEPLOY.md) — Cloudflare Pages, GitHub Secrets
- [API 문서](https://api.breadbread.io/api-docs.html)
- [모니터링 대시보드 (Grafana)](https://livelysamosa206.grafana.net/public-dashboards/fd40ccf21ed84237ae3fe1037a073b51) — Cloud Run 실시간 메트릭
