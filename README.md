# MVP Architecture
<img width="2023" height="1370" alt="breadbread_architecture_v4" src="https://github.com/user-attachments/assets/abc6ddaa-250a-4612-bae8-298735bbb74e" />

```
apps/fe/src/
├─ api/                      # 서버 통신 관련
│  └─ client.ts
│
├─ assets/                   # 정적 리소스
│  ├─ hero.png
│  ├─ react.svg
│  ├─ vite.svg
│  ├─ icons/
│  └─ images/
│
├─ components/
│  ├─ common/                # 공통 UI 컴포넌트
│  │  ├─ Button/
│  │  │  └─ Button.tsx
│  │  ├─ card/
│  │  │  └─ Card.tsx
│  │  ├─ footer/
│  │  │  └─ OverlayFooter.tsx
│  │  ├─ icon/
│  │  │  └─ Icon.tsx
│  │  ├─ section-header/
│  │  │  └─ SectionHeader.tsx
│  │  ├─ skeleton/
│  │  │  └─ Skeleton.tsx
│  │  └─ index.ts
│  │
│  ├─ layout/
│  │  ├─ BottomNav.tsx
│  │  └─ MobileFrame.tsx
│  │
│  └─ domain/
│     ├─ ai-course/
│     │  ├─ PreferenceCard.tsx
│     │  └─ ResultList.tsx
│     ├─ bakery/
│     │  ├─ BakeryCard.tsx
│     │  └─ BakeryList.tsx
│     └─ home/               # 현재 비어 있음(예정)
│
├─ hooks/
│  ├─ useLoading.ts
│  └─ useModal.ts
│
├─ pages/
│  ├─ AiCoursePage.tsx
│  ├─ BreadPreference.tsx
│  ├─ HomePage.tsx
│  └─ MyPage.tsx
│
├─ routes/
│  ├─ __root.tsx
│  └─ index.tsx
│
├─ styles/
│  ├─ globals.css
│  └─ tailwind.css
│
├─ tokens/
│  └─ tokens.json
│
├─ utils/
│  ├─ cn.ts
│  └─ format.ts
│
├─ index.css
├─ main.tsx
└─ routeTree.gen.ts
```