# BreadBread 개발 가이드라인

## 협업 규칙

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

패키지는 **루트에서 명령어를 실행**하지만, `apps/fe/package.json`에 등록됩니다.

```bash
# FE 패키지 설치 → apps/fe/package.json에 추가됨
pnpm add 패키지명 --filter fe

# 개발 의존성
pnpm add -D 패키지명 --filter fe
```

### 주의사항

- **main에 직접 push 금지** — Branch Protection이 설정되어 있습니다
- **`.env` 파일 커밋 금지** — 시크릿 키가 포함됩니다 (`.gitignore` 적용됨)
- **`pnpm install`은 루트에서만** — `apps/fe` 안에서 실행하지 마세요
- **PR merge 후 브랜치 삭제** — GitHub에서 "Delete branch" 클릭

---

## API 명세 확인

- 배포된 Swagger: [api.breadbread.io/swagger-ui/index.html](https://api.breadbread.io/swagger-ui/index.html)

---

## 문의

작업 중 막히는 부분은 팀 채널에 공유해주세요.
