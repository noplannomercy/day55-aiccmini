# AICC Mini - Architecture

## 프로젝트 구조

```
day55-aiccmini/
├── drizzle.config.ts
├── CLAUDE.md
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── layout.tsx          # 미니멀 레이아웃
│   │   │   └── login/page.tsx
│   │   ├── (main)/
│   │   │   ├── layout.tsx          # Sidebar + Header
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── tickets/
│   │   │   │   ├── page.tsx        # 목록
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx   # 상세
│   │   │   ├── kb/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── edit/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   └── settings/
│   │   │       ├── users/page.tsx
│   │   │       ├── rules/page.tsx
│   │   │       └── audit/page.tsx
│   │   └── api/
│   │       ├── auth/callback/route.ts
│   │       ├── mock-login/route.ts
│   │       ├── tickets/
│   │       │   ├── route.ts
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── status/route.ts
│   │       │       ├── assign/route.ts
│   │       │       └── comments/route.ts
│   │       ├── kb/route.ts
│   │       ├── kb/[id]/route.ts
│   │       ├── rules/route.ts
│   │       ├── notifications/route.ts
│   │       ├── audit/route.ts
│   │       ├── users/route.ts
│   │       └── dashboard/route.ts
│   ├── components/
│   │   ├── layout/
│   │   ├── tickets/
│   │   ├── kb/
│   │   ├── rules/
│   │   ├── dashboard/
│   │   ├── notifications/
│   │   ├── audit/
│   │   ├── users/
│   │   └── ui/                     # shadcn/ui (수정 금지)
│   ├── lib/
│   │   ├── db/
│   │   ├── auth.ts
│   │   ├── audit.middleware.ts
│   │   ├── tenant.ts
│   │   ├── utils.ts
│   │   └── errors.ts
│   ├── services/
│   ├── types/index.ts
│   └── middleware.ts
└── docs/
```

## 라우팅

### 라우트 그룹

| 그룹 | 경로 | 레이아웃 | 접근 |
|------|------|---------|------|
| `(auth)` | `/login` | 미니멀 (로고만) | 비로그인 |
| `(main)` | `/dashboard`, `/tickets/*`, `/kb/*` 등 | Sidebar + Header | 로그인 필수 |

### 역할별 접근 제어 (middleware.ts)

| 경로 패턴 | 최소 역할 |
|----------|---------|
| `/settings/rules` | admin |
| `/settings/users` | admin |
| `/settings/audit` | admin |
| `/tickets/*`, `/kb/*/edit` | agent 이상 |
| `/dashboard`, `/kb`, `/notifications` | 모든 로그인 사용자 |

### API 역할 체크 패턴

모든 Route Handler는 다음 순서로 처리:
1. `createServerClient()` + `supabase.auth.getUser()` — 세션 확인
2. User 테이블에서 `role` 조회 (Drizzle ORM)
3. 역할 체크 (`user.role`)
4. `tenant_id` 추출
5. 서비스 함수 호출
6. JSON 응답

## 상태 관리

- **서버 상태**: Server Component에서 직접 서비스 함수 호출 (fetch 없음)
- **클라이언트 상태**: `useState` + `useRouter().refresh()` (목록 갱신)
- **폼 상태**: `react-hook-form` + `zod` 유효성 검사
- **전역 상태 없음**: Redux/Zustand 미사용 — Server Component + route refresh로 충분

## 컴포넌트 계층 구조

```
(main)/layout.tsx
  └── MainLayout
        ├── Sidebar          ← 역할별 메뉴 필터링
        │     └── NavItem[]
        └── Header
              ├── UserInfo
              └── NotificationBell  ← 미읽음 카운트 배지

페이지 예시: /tickets/[id]/page.tsx (Server Component)
  ├── TicketStatusBadge
  ├── PriorityBadge
  ├── AssigneeSelector      (use client)
  ├── StatusChanger         (use client)
  ├── AttachmentMeta
  └── CommentSection        (use client)
        ├── CommentList
        └── CommentForm
```

## 서비스 레이어 설계 패턴

### 함수 시그니처 규칙

```
서비스함수(tenantId: string, ...params): Promise<Result>
```

모든 서비스 함수는 첫 번째 인자로 `tenantId`를 받는다.

### 책임 분리

| 레이어 | 역할 | 금지사항 |
|--------|------|---------|
| Route Handler | 인증, 권한, 요청 파싱, 응답 직렬화 | DB 직접 접근 |
| Service | 비즈니스 로직, DB 쿼리, 감사로그, 알림 트리거 | HTTP 개념 |
| DB Schema | 테이블 정의, 관계 | 비즈니스 로직 |

### 에러 처리 흐름

```
Service throws AppError(code, message)
  → Route Handler catches
  → HTTP 상태 코드 매핑 (404/403/400/500)
  → { error: message } JSON 응답
```

### 서비스 간 의존성

```
ticket.service
  ├── rule.service (티켓 생성 시 applyRules 호출)
  ├── notification.service (배정/상태변경 시 알림 생성)
  └── audit.service (모든 변경 시 로그 기록)

kb.service
  └── audit.service

rule.service
  └── audit.service

user.service
  └── audit.service
```
