# BreadBread 개발 가이드라인

## 목차
1. [프로젝트 소개](#1-프로젝트-소개)
2. [기술 스택](#2-기술-스택)
3. [로컬 개발 환경 세팅](#3-로컬-개발-환경-세팅)
4. [협업 규칙](#4-협업-규칙)
5. [FE 작업 순서](#5-fe-작업-순서)
6. [BE 작업 순서](#6-be-작업-순서)

---

## 1. 프로젝트 소개

**BreadBread**는 개인화된 대전 빵집 투어 관광 에이전트입니다.

- **FE**: React + TanStack Router/Query + Tailwind CSS v4
- **BE**: NestJS + TypeORM + PostgreSQL (pgvector)
- **배포**: Vercel (FE) / Google Cloud Run (BE) / Cloud SQL (DB)
- **모노레포**: pnpm workspace (`apps/fe`, `apps/be`)

---

## 2. 기술 스택

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
| 프레임워크 | NestJS |
| ORM | TypeORM |
| DB | PostgreSQL + pgvector |
| API 문서 | Swagger (자동 생성) |
| 인증 | OAuth2 (소셜 로그인) + JWT |

---

## 3. 로컬 개발 환경 세팅

### 공통
```bash
# 레포 클론
git clone https://github.com/TeamBreadBread/breadbread.git
cd breadbread

# 패키지 설치 (루트에서 한 번만)
pnpm install
```

> **주의:** `pnpm install`은 항상 루트(`breadbread/`)에서 실행하세요.
> `apps/fe`나 `apps/be` 안에서 실행하면 안 됩니다.

### Frontend 실행
```bash
cd apps/fe
pnpm dev
```

- 개발 시 API는 **Postman Mock Server**를 사용합니다 (`.env.development` 자동 적용)
- 실제 BE 서버 없이도 개발 가능합니다

### Backend 실행

**1. DB 실행 (Docker 필요)**
```bash
cd apps/be
docker compose up -d
```

**2. 환경변수 설정**
```bash
cp .env.example .env
# .env 파일을 열어 DB 비밀번호 등 설정
```

**3. 서버 실행**
```bash
pnpm start:dev
```

- 서버 실행 시 `static/openapi.yaml`이 자동으로 갱신됩니다
- `http://localhost:3000/api-docs`에서 Swagger 문서 확인 가능

---

## 4. 협업 규칙

### 브랜치 전략 (GitHub Flow)

```
main                    ← 배포 브랜치 (직접 push 금지)
feat/fe/기능명          ← FE 기능 브랜치
feat/be/기능명          ← BE 기능 브랜치
fix/fe/버그명           ← FE 버그 수정
fix/be/버그명           ← BE 버그 수정
chore/작업명            ← 설정, 문서, 패키지 등
```

### PR 프로세스

1. **Issue 생성** → 작업 내용 정의
2. **브랜치 생성** → `git checkout -b feat/fe/기능명`
3. **작업 후 PR 생성** → 제공된 PR 템플릿 작성
4. **코드 리뷰** → FE는 FE 팀원, BE는 BE 팀원이 리뷰
5. **1명 Approve 후 merge** → 브랜치 삭제

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
chore: 설정, 패키지, 문서 등
refactor: 리팩토링 (기능 변경 없음)
style: 스타일 변경 (CSS 등)
```

예시:
```
feat: 베이커리 목록 페이지 구현
fix: 로그인 토큰 만료 처리 오류 수정
```

### 패키지 설치 규칙

패키지는 **루트에서 명령어를 실행**하지만, 각 앱의 `package.json`에 등록됩니다.

```bash
# FE 패키지 설치 → apps/fe/package.json에 추가됨
pnpm add 패키지명 --filter fe

# BE 패키지 설치 → apps/be/package.json에 추가됨
pnpm add 패키지명 --filter bread-be

# 개발 의존성
pnpm add -D 패키지명 --filter fe
```

### 주의사항

- **main에 직접 push 금지** — Branch Protection이 설정되어 있습니다
- **`.env` 파일 커밋 금지** — 시크릿 키가 포함됩니다 (`.gitignore` 적용됨)
- **`pnpm-lock.yaml`은 루트 하나만** — `apps/fe`, `apps/be` 안에 생기면 삭제하세요
- **PR merge 후 브랜치 삭제** — GitHub에서 "Delete branch" 클릭

---

## 5. FE 작업 순서

> 각 작업은 별도 브랜치에서 PR로 진행합니다.

### 1단계: 디자인 토큰
- [ ] Figma에서 디자인 토큰 추출 후 Tailwind CSS에 연동

### 2단계: 공통 컴포넌트
- [ ] `feat/fe/common-components` 브랜치 생성
- [ ] Button, Input, Modal 등 공통 UI 컴포넌트
- [ ] 디자인 토큰 기반으로 Tailwind 클래스 적용
- [ ] 로딩/에러 상태 공통 처리

### 3단계: 인증
- [ ] `feat/fe/auth` 브랜치 생성
- [ ] 소셜 로그인 페이지 구현 (OAuth2 Authorization Code Flow)
- [ ] 로그인 후 JWT 토큰 저장 (Zustand)
- [ ] 인증 필요 라우트 보호 (`_authenticated` 레이아웃)
- [ ] 자동 로그인 처리 (토큰 갱신)

---

## 6. BE 작업 순서

> 각 작업은 별도 브랜치에서 PR로 진행합니다.
> API 변경 시 `openapi.yaml`이 자동 갱신되어 Postman Mock Server에 반영됩니다.

### 1단계: DB 엔티티 설계
- [ ] `feat/be/entities` 브랜치 생성
- [ ] User, Bakery, Course, Reservation, Payment, Review 엔티티 작성
- [ ] TypeORM 마이그레이션 설정

### 2단계: 인증
- [ ] `feat/be/auth` 브랜치 생성
- [ ] OAuth2 소셜 로그인 (Google, Kakao)
- [ ] JWT 발급/갱신/검증
- [ ] 인증 Guard 구현

---

## API 명세 확인

FE 개발 시 실제 BE 없이 **Postman Mock Server**를 사용합니다.

- Mock Server URL: `.env.development`에 설정됨 (자동 적용)
- API 명세: Postman Workspace에서 확인
- BE가 API를 변경하면 `openapi.yaml`이 자동으로 Postman에 반영됩니다

---

## 문의

작업 중 막히는 부분은 팀 채널에 공유해주세요.
