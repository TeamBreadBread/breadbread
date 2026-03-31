# MVP Architecture
<img width="2023" height="1370" alt="breadbread_architecture_v4" src="https://github.com/user-attachments/assets/abc6ddaa-250a-4612-bae8-298735bbb74e" />


src/
├─ api/                      # 서버 통신 관련 (axios, fetch, API 함수)
│
├─ Assets/                   # 이미지, 아이콘 등 정적 리소스
│
├─ routes/                   # 라우팅 설정 (페이지 연결)
│
├─ tokens/                   # 디자인 토큰 관리
│  └─ tokens.json            # 색상, spacing, typography 등
│
├─ components/               # ⭐ 
│  ├─ common/                # 공통 UI 컴포넌트
│  │  ├─ button/
│  │  │  ├─ Button.tsx       # 버튼 컴포넌트
│  │  │  └─ index.ts
│  │  ├─ input/
│  │  │  ├─ Input.tsx        # 입력 컴포넌트
│  │  │  └─ index.ts
│  │  ├─ modal/
│  │  │  ├─ Modal.tsx        # 기본 모달
│  │  │  └─ index.ts
│  │  ├─ chip/
│  │  │  ├─ Chip.tsx         # 선택형 버튼
│  │  │  └─ index.ts
│  │  ├─ card/
│  │  │  ├─ Card.tsx         # 기본 카드
│  │  │  └─ index.ts
│  │  ├─ spinner/
│  │  │  ├─ Spinner.tsx      # 로딩
│  │  │  └─ index.ts
│  │  ├─ error-state/
│  │  │  ├─ ErrorState.tsx   # 에러 UI
│  │  │  └─ index.ts
│  │  ├─ empty-state/
│  │  │  ├─ EmptyState.tsx   # 빈 상태 UI
│  │  │  └─ index.ts
│  │  └─ index.ts            # barrel export
│  │
│  ├─ layout/                # 레이아웃 UI
│  │  ├─ Header.tsx          # 상단 헤더
│  │  ├─ BottomNav.tsx       # 하단 네비
│  │  └─ PageContainer.tsx   # max-width 컨테이너
│  │
│  └─ domain/                # 기능별 UI (빵집, AI 추천 등)
│     ├─ bakery/
│     │  ├─ BakeryCard.tsx
│     │  └─ BakeryList.tsx
│     └─ ai-course/
│        ├─ PreferenceCard.tsx
│        └─ ResultList.tsx
│
├─ pages/                    # ⭐ 페이지 단위 추가 (없으면 추가 추천)
│  ├─ HomePage.tsx
│  ├─ AiCoursePage.tsx
│  └─ MyPage.tsx
│
├─ hooks/                    # 공통 로직
│  ├─ useModal.ts
│  └─ useLoading.ts
│
├─ utils/                    # 유틸 함수
│  ├─ cn.ts                  # className merge
│  └─ format.ts
│
├─ styles/                   # ⭐ Tailwind + 글로벌 스타일
│  ├─ globals.css
│  └─ tailwind.css