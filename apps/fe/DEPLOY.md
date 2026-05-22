# FE 배포 (팀 · GitHub Actions)

운영 사이트는 **`main` push 시** [.github/workflows/cd-firebase-hosting.yml](../../.github/workflows/cd-firebase-hosting.yml) 가 자동으로 빌드·배포합니다.

로컬 `.env.local` 은 **개발용**이며, 배포 번들에는 **GitHub Repository Secrets** 만 반영됩니다.

## 1. GitHub Secrets 등록

Repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### 필수 (소셜 로그인)

| Secret 이름 | 설명 |
|-------------|------|
| `VITE_KAKAO_REST_API_KEY` | 카카오 **REST API** 키 (로그인 Client ID와 동일 값 → Cloud Run `KAKAO_CLIENT_ID`) |
| `VITE_NAVER_CLIENT_ID` | 네이버 로그인 Client ID |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID |

### 권장

| Secret 이름 | 설명 |
|-------------|------|
| `VITE_KAKAO_MAP_KEY` | 카카오맵 JavaScript 키 |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Hosting 배포용 서비스 계정 JSON (아래 참고) |

### 선택

| Secret 이름 | 설명 |
|-------------|------|
| `VITE_FIREBASE_VAPID_KEY` | FCM Web Push VAPID 공개 키 |
| `VITE_PORTONE_STORE_ID` | 포트원 결제 |
| `VITE_PORTONE_CHANNEL_KEY` | 포트원 채널 키 |

## 2. `FIREBASE_SERVICE_ACCOUNT` 만들기

1. [Firebase 콘솔](https://console.firebase.google.com/) → 프로젝트 `breadbread-491001` (`.firebaserc` 참고)
2. **프로젝트 설정** → **서비스 계정** → **새 비공개 키 생성** → JSON 다운로드
3. JSON 파일 **전체 내용**을 Secret `FIREBASE_SERVICE_ACCOUNT` 값으로 붙여 넣기

## 3. 배포 확인

1. Secret 저장 후 `main`에 FE 변경 push (또는 Actions → **Deploy FE** → **Run workflow**)
2. Actions 탭에서 워크플로 성공 확인
3. https://www.breadbread.io 에서 구글/카카오/네이버 로그인 (`.env.local` alert 가 없어야 함)

## 4. 로컬 개발

```bash
cp .env.example .env.local   # 값 채우기
pnpm dev                     # apps/fe
```

## 5. 수동 배포 (비상용)

CI 없이 로컬에서만 배포할 때는 빌드 전에 `apps/fe/.env.production` 또는 `.env.local` 이 있어야 합니다.

```bash
cd apps/fe
pnpm run deploy:hosting
```

팀 운영은 **CI 배포만** 사용하는 것을 권장합니다.
