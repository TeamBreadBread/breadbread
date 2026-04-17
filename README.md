# MVP Architecture

<img width="2023" height="1370" alt="breadbread_architecture_v5" src="https://github.com/user-attachments/assets/d567b8e2-041c-4f2d-ae6e-dc99c9ece121" />
# 🥐 BBANG - AI 빵 투어 추천 서비스

> 사용자 취향 기반으로 빵집 코스를 추천해주는 AI 서비스  
> (Frontend MVP - React + TanStack Router 기반)

---

## 📌 프로젝트 소개

BBANG은 사용자의 취향을 기반으로  
맞춤형 빵집 코스를 추천해주는 서비스입니다.

사용자는 간단한 선택만으로  
자신에게 맞는 빵 투어 코스를 추천받을 수 있습니다.

---

## 🎯 주요 기능 (MVP)

### 🏠 홈
- 큐레이션 카드 (가로 스크롤)
- 퀵 메뉴

### 🤖 AI 코스 추천
- 취향 선택 (동행, 분위기 등)
- 코스 자동 생성 결과 UI

### 👤 인증 (Auth)
- 회원가입
- 아이디 찾기
- 비밀번호 찾기
- 비밀번호 재설정
- 성공 / 실패 결과 페이지

---

## 🧱 프로젝트 구조

```
apps/fe/src/
├─ components/
│ ├─ common/ # 공통 UI 컴포넌트
│ │ ├─ form/ # 입력 관련
│ │ │ ├─ TextField.tsx
│ │ │ ├─ ActionField.tsx
│ │ │ ├─ PasswordField.tsx
│ │ │ └─ FieldLabel.tsx
│ │ │
│ │ ├─ footer/
│ │ │ ├─ BottomCTA.tsx
│ │ │ └─ BottomDoubleCTA.tsx
│ │ │
│ │ ├─ topbar/
│ │ │ ├─ StatusBar.tsx
│ │ │ └─ AppTopBar.tsx
│ │ │
│ │ └─ index.ts
│ │
│ ├─ layout/
│ │ └─ MobileFrame.tsx
│ │
│ └─ domain/
│ └─ auth/ # 인증 관련 도메인 컴포넌트
│ ├─ AuthIntroSection.tsx
│ ├─ AuthLinkRow.tsx
│ ├─ PhoneVerificationSection.tsx
│ ├─ FindIdFormSection.tsx
│ ├─ FindPasswordFormSection.tsx
│ ├─ FindIdSuccessSection.tsx
│ ├─ FindIdFailureSection.tsx
│ ├─ PasswordResetSuccessSection.tsx
│ └─ ...
│
├─ pages/ # 페이지 단위
│ ├─ HomePage.tsx
│ ├─ AiCoursePage.tsx
│ ├─ BreadPreference.tsx
│ ├─ FindIdPage.tsx
│ ├─ FindIdResultPage.tsx
│ ├─ FindIdFailurePage.tsx
│ ├─ FindPasswordPage.tsx
│ ├─ ResetPasswordPage.tsx
│ └─ PasswordResetSuccessPage.tsx
│
├─ routes/ # TanStack Router
│ ├─ __root.tsx
│ └─ index.tsx
│
├─ styles/
│ ├─ globals.css
│ └─ tailwind.css
│
├─ tokens/
│ └─ tokens.json # 디자인 토큰
│
├─ utils/
│ ├─ cn.ts # className 유틸
│ └─ format.ts
```

---

## 🧩 컴포넌트 설계 기준

### 1️⃣ Common
재사용 가능한 UI 컴포넌트

- Button, Input, CTA
- Layout (Header, Footer)
- Form 요소

👉 여러 페이지에서 반복 사용

---

### 2️⃣ Domain
기능 단위 묶음

- auth (회원가입 / 로그인 / 찾기)
- ai-course
- bakery

👉 특정 기능에서만 의미 있음

---

### 3️⃣ Page
조립 역할

```tsx
Page = Layout + Domain + Common
