# AICC Mini - IMPLEMENTATION PLAN

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** 멀티테넌트 고객지원 티켓 관리 + 지식베이스 + 자동화 룰 엔진을 갖춘 AICC Mini 시스템 구축

**Architecture:** Next.js 16 App Router 기반, Supabase (hosted PostgreSQL) + Drizzle ORM, Supabase Auth 인증, shadcn/ui + Tailwind CSS UI. 모든 데이터는 `tenant_id`로 격리되며, 서비스 레이어가 비즈니스 로직을 담당하고 API Route Handler가 HTTP 인터페이스를 제공한다.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase (hosted PostgreSQL + Auth), Drizzle ORM, shadcn/ui, Tailwind CSS, Recharts

---

## Wave 1: 공통 기반 (레이아웃, 타입, 서비스 레이어, 네비게이션)

> 모든 후속 Wave의 전제 조건. 이 Wave 없이 다른 Wave 진행 불가.

### 파일 목록

**인프라/설정**
| 파일 | 역할 |
|------|------|
| `.env.local` | 환경변수 (DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) |
| `drizzle.config.ts` | Drizzle 마이그레이션 설정 |

**DB 스키마 (전체 8 엔티티 - 한 번에 정의)**
| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/lib/db/schema.ts` | 전체 스키마 정의 | 없음 |
| `src/lib/db/index.ts` | DB 연결 singleton | `schema.ts` |
| `src/lib/db/seed.ts` | 초기 데이터 (테넌트, admin 유저) | `db/index.ts` |

**타입 정의**
| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/types/index.ts` | 공통 TypeScript 타입 (Tenant, User, Ticket, KBArticle, AutoRule, AuditLog 등) | `schema.ts` (Drizzle InferSelect) |

**인증**
| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/lib/auth.ts` | Supabase 서버/클라이언트 헬퍼 (createServerClient, createBrowserClient) | 없음 |
| `src/app/api/auth/callback/route.ts` | Supabase OAuth 콜백 핸들러 | `lib/auth.ts` |
| `src/app/api/mock-login/route.ts` | 개발용 mock 로그인 (Supabase signInWithPassword) | `lib/auth.ts` |
| `src/middleware.ts` | Supabase 세션 갱신 + 역할 기반 라우트 보호 | `lib/auth.ts`, `db/index.ts` |

**공통 레이아웃 & 네비게이션**
| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/components/layout/Sidebar.tsx` | 좌측 네비게이션 (역할별 메뉴 필터링) | `types/index.ts` |
| `src/components/layout/Header.tsx` | 상단 헤더 (사용자 정보, 알림 아이콘, 로그아웃) | `types/index.ts` |
| `src/app/(main)/layout.tsx` | 메인 앱 레이아웃 (Sidebar + Header 조합) | `Sidebar.tsx`, `Header.tsx` |
| `src/app/(auth)/layout.tsx` | 인증 페이지용 미니멀 레이아웃 | 없음 |

**공통 UI 유틸**
| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/lib/utils.ts` | shadcn/ui cn() 헬퍼, 날짜 포맷, 페이지네이션 헬퍼 | 없음 |
| `src/lib/errors.ts` | 공통 에러 클래스 (AppError, NotFoundError, ForbiddenError) | 없음 |
| `src/components/ui/` | shadcn/ui 컴포넌트 (npx shadcn add로 설치) | 없음 |

### 태스크 분해

**Task 1-A (혼자 가능): 인프라 설정**
- Supabase 프로젝트 생성 (supabase.com)
- 프로젝트 Settings → Database → Connection string(URI) 복사
- `.env.local` 에 `DATABASE_URL` 설정
- `drizzle.config.ts` 설정

**Task 1-B (1-A 완료 후): DB 스키마 & 타입**
- `src/lib/db/schema.ts` — 8개 엔티티 전체 스키마
- `src/lib/db/index.ts` — DB 연결
- `src/types/index.ts` — Drizzle InferSelect 기반 타입
- `drizzle-kit push` 마이그레이션 실행
- `src/lib/db/seed.ts` 작성 및 실행

**Task 1-C (1-B와 병렬 가능): 공통 유틸**
- `src/lib/utils.ts`
- `src/lib/errors.ts`
- shadcn/ui 기본 컴포넌트 설치 (button, input, badge, card, table, dialog, form, select, textarea)

**Task 1-D (1-B 완료 후): 인증 설정**
- `src/lib/auth.ts` — Supabase createServerClient / createBrowserClient 헬퍼
- `src/app/api/auth/callback/route.ts` — Supabase OAuth 콜백 핸들러
- `src/app/api/mock-login/route.ts` — Supabase signInWithPassword mock
- `src/middleware.ts` — Supabase 세션 갱신 + 역할 체크

**Task 1-E (1-D 완료 후): 레이아웃 & 네비게이션**
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/app/(main)/layout.tsx`
- `src/app/(auth)/layout.tsx`
- `/dashboard` 더미 페이지로 레이아웃 동작 확인

---

## Wave 2: 인증 & 사용자 관리

> Wave 1 전체 완료 후 진행. F19, F20, F21, F22 구현.

### 파일 목록

| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/services/user.service.ts` | 사용자 CRUD, 역할 변경, 테넌트 기반 목록 조회 | `db/index.ts`, `types/index.ts` |
| `src/app/api/users/route.ts` | GET(목록), POST(생성) | `user.service.ts`, `lib/auth.ts` |
| `src/app/api/users/[id]/route.ts` | GET, PATCH(역할변경), DELETE | `user.service.ts` |
| `src/app/(auth)/login/page.tsx` | 로그인 UI (Google OAuth 버튼 + Mock 로그인 폼) | `lib/auth.ts` |
| `src/app/(main)/settings/users/page.tsx` | 사용자 관리 페이지 (admin 전용) | `UserList.tsx` |
| `src/components/users/UserList.tsx` | 사용자 테이블 (역할 변경, 비활성화) | `types/index.ts` |
| `src/components/users/UserRoleBadge.tsx` | admin/agent/viewer 배지 | `types/index.ts` |

### 태스크 분해

**Task 2-A (Wave 1 완료 후): 사용자 서비스 & API**
- `src/services/user.service.ts`
- `src/app/api/users/route.ts`
- `src/app/api/users/[id]/route.ts`

**Task 2-B (2-A와 병렬 가능): 로그인 페이지**
- `src/app/(auth)/login/page.tsx`
- Google OAuth 버튼 (`supabase.auth.signInWithOAuth({ provider: 'google' })`)
- Mock 로그인 폼 (이메일/비번 → `/api/mock-login`)
- 로그인 → `/dashboard` 리다이렉트 확인

**Task 2-C (2-A 완료 후): 사용자 관리 UI**
- `src/components/users/UserRoleBadge.tsx`
- `src/components/users/UserList.tsx`
- `src/app/(main)/settings/users/page.tsx`

---

## Wave 3: 티켓 CRUD 핵심

> Wave 2 완료 후 진행. F01~F04, F07 (기본 필터) 구현.

### 파일 목록

| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/services/ticket.service.ts` | 티켓 CRUD, 상태변경, 우선순위, 담당자배정, 필터/검색 | `db/index.ts`, `types/index.ts` |
| `src/app/api/tickets/route.ts` | GET(목록+필터), POST(생성) | `ticket.service.ts` |
| `src/app/api/tickets/[id]/route.ts` | GET(상세), PATCH(수정), DELETE | `ticket.service.ts` |
| `src/app/api/tickets/[id]/status/route.ts` | PATCH — 상태 변경 전용 | `ticket.service.ts` |
| `src/app/api/tickets/[id]/assign/route.ts` | PATCH — 담당자 배정 전용 | `ticket.service.ts` |
| `src/components/tickets/TicketStatusBadge.tsx` | open/in_progress/resolved/closed 배지 | `types/index.ts` |
| `src/components/tickets/PriorityBadge.tsx` | low/medium/high/urgent 배지 | `types/index.ts` |
| `src/components/tickets/TicketFilters.tsx` | 상태/우선순위/담당자/키워드 필터 폼 | `types/index.ts` |
| `src/components/tickets/TicketCard.tsx` | 목록용 티켓 카드 | `TicketStatusBadge.tsx`, `PriorityBadge.tsx` |
| `src/components/tickets/TicketForm.tsx` | 생성/수정 폼 (react-hook-form + zod) | `types/index.ts` |
| `src/app/(main)/tickets/page.tsx` | 티켓 목록 페이지 | `TicketCard.tsx`, `TicketFilters.tsx` |
| `src/app/(main)/tickets/new/page.tsx` | 티켓 생성 페이지 | `TicketForm.tsx` |
| `src/app/(main)/tickets/[id]/page.tsx` | 티켓 상세 페이지 (상태변경, 담당자배정 포함) | `TicketForm.tsx`, `TicketStatusBadge.tsx` |

### 태스크 분해

**Task 3-A: 티켓 서비스 & API**
- `src/services/ticket.service.ts` (CRUD + 상태변경 + 담당자배정 + 필터)
- `src/app/api/tickets/route.ts`
- `src/app/api/tickets/[id]/route.ts`
- `src/app/api/tickets/[id]/status/route.ts`
- `src/app/api/tickets/[id]/assign/route.ts`

**Task 3-B (3-A와 병렬 가능): 티켓 공통 컴포넌트**
- `src/components/tickets/TicketStatusBadge.tsx`
- `src/components/tickets/PriorityBadge.tsx`
- `src/components/tickets/TicketFilters.tsx`
- `src/components/tickets/TicketCard.tsx`
- `src/components/tickets/TicketForm.tsx`

**Task 3-C (3-A + 3-B 완료 후): 티켓 페이지**
- `src/app/(main)/tickets/page.tsx`
- `src/app/(main)/tickets/new/page.tsx`
- `src/app/(main)/tickets/[id]/page.tsx`

---

## Wave 4: 티켓 확장 (댓글/첨부) + 지식베이스

> Wave 3 완료 후 진행. F05, F06, F09~F12 구현.

### 파일 목록

**댓글/첨부 (F05, F06)**
| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/services/comment.service.ts` | 댓글 CRUD, 내부메모 플래그 | `db/index.ts`, `types/index.ts` |
| `src/app/api/tickets/[id]/comments/route.ts` | GET(목록), POST(작성) | `comment.service.ts` |
| `src/app/api/tickets/[id]/comments/[commentId]/route.ts` | DELETE | `comment.service.ts` |
| `src/components/tickets/CommentList.tsx` | 댓글 목록 (공개/내부메모 구분) | `types/index.ts` |
| `src/components/tickets/CommentForm.tsx` | 댓글 작성 폼 (내부메모 토글) | `types/index.ts` |
| `src/components/tickets/AttachmentMeta.tsx` | 첨부파일 URL 링크 표시 | `types/index.ts` |

**지식베이스 (F09~F12)**
| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/services/kb.service.ts` | KB 문서 CRUD, 태그관리, 키워드검색, 버전 증가 | `db/index.ts`, `types/index.ts` |
| `src/app/api/kb/route.ts` | GET(목록+검색), POST(생성) | `kb.service.ts` |
| `src/app/api/kb/[id]/route.ts` | GET(상세), PATCH(수정+버전증가), DELETE | `kb.service.ts` |
| `src/app/api/kb/[id]/tags/route.ts` | POST(태그추가), DELETE(태그제거) | `kb.service.ts` |
| `src/components/kb/ArticleCard.tsx` | KB 문서 카드 (태그, 버전 표시) | `types/index.ts` |
| `src/components/kb/ArticleEditor.tsx` | 문서 편집기 (textarea 기반 마크다운) | `types/index.ts` |
| `src/components/kb/TagManager.tsx` | 태그 추가/제거 인라인 UI | `types/index.ts` |
| `src/components/kb/SearchBar.tsx` | 키워드 검색 입력 | 없음 |
| `src/app/(main)/kb/page.tsx` | KB 목록 + 검색 페이지 | `ArticleCard.tsx`, `SearchBar.tsx` |
| `src/app/(main)/kb/[id]/page.tsx` | KB 상세 페이지 (버전, 태그 표시) | `TagManager.tsx` |
| `src/app/(main)/kb/[id]/edit/page.tsx` | KB 편집 페이지 (agent+ 전용) | `ArticleEditor.tsx`, `TagManager.tsx` |

### 태스크 분해

**Task 4-A: 댓글 서비스 & API**
- `src/services/comment.service.ts`
- `src/app/api/tickets/[id]/comments/route.ts`
- `src/app/api/tickets/[id]/comments/[commentId]/route.ts`

**Task 4-B (4-A와 병렬 가능): 댓글 UI & 티켓 상세 통합**
- `src/components/tickets/CommentList.tsx`
- `src/components/tickets/CommentForm.tsx`
- `src/components/tickets/AttachmentMeta.tsx`
- 티켓 상세 페이지(`[id]/page.tsx`)에 CommentList, CommentForm, AttachmentMeta 통합

**Task 4-C (4-A, 4-B와 독립적): KB 서비스 & API**
- `src/services/kb.service.ts`
- `src/app/api/kb/route.ts`
- `src/app/api/kb/[id]/route.ts`
- `src/app/api/kb/[id]/tags/route.ts`

**Task 4-D (4-C와 병렬 가능): KB 컴포넌트 & 페이지**
- `src/components/kb/ArticleCard.tsx`
- `src/components/kb/ArticleEditor.tsx`
- `src/components/kb/TagManager.tsx`
- `src/components/kb/SearchBar.tsx`
- `src/app/(main)/kb/page.tsx`
- `src/app/(main)/kb/[id]/page.tsx`
- `src/app/(main)/kb/[id]/edit/page.tsx`

---

## Wave 5: 자동화 룰 엔진

> Wave 3 완료 후 진행 가능 (Wave 4와 병렬 가능). F13~F15 구현.

### 파일 목록

| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/services/rule.service.ts` | 룰 CRUD, 룰 토글, 티켓 대상 룰 매칭 & 실행 엔진 | `db/index.ts`, `types/index.ts`, `ticket.service.ts` |
| `src/app/api/rules/route.ts` | GET(목록), POST(생성) | `rule.service.ts` |
| `src/app/api/rules/[id]/route.ts` | GET, PATCH(수정), DELETE | `rule.service.ts` |
| `src/app/api/rules/[id]/toggle/route.ts` | PATCH — 활성/비활성 토글 | `rule.service.ts` |
| `src/components/rules/RuleList.tsx` | 룰 목록 테이블 (토글 버튼 포함) | `types/index.ts` |
| `src/components/rules/RuleForm.tsx` | 룰 생성/수정 폼 (조건: 키워드/우선순위, 액션: 담당자배정/상태변경) | `types/index.ts` |
| `src/components/rules/RuleToggle.tsx` | 활성/비활성 스위치 | `types/index.ts` |
| `src/app/(main)/settings/rules/page.tsx` | 룰 관리 페이지 (admin 전용) | `RuleList.tsx`, `RuleForm.tsx` |

**자동 실행 통합 (기존 파일 수정)**
| 파일 | 수정 내용 | 의존성 |
|------|----------|--------|
| `src/services/ticket.service.ts` | 티켓 생성 후 `rule.service.applyRules(ticket)` 호출 추가 | `rule.service.ts` |

### 태스크 분해

**Task 5-A: 룰 서비스 & API**
- `src/services/rule.service.ts` (CRUD + 토글 + 룰 매칭 엔진)
- `src/app/api/rules/route.ts`
- `src/app/api/rules/[id]/route.ts`
- `src/app/api/rules/[id]/toggle/route.ts`

**Task 5-B (5-A와 병렬 가능): 룰 UI**
- `src/components/rules/RuleToggle.tsx`
- `src/components/rules/RuleForm.tsx`
- `src/components/rules/RuleList.tsx`
- `src/app/(main)/settings/rules/page.tsx`

**Task 5-C (5-A 완료 후): 자동 실행 통합**
- `src/services/ticket.service.ts` 수정 — 티켓 생성 로직에 `rule.service.applyRules()` 통합

---

## Wave 6: 시스템 기능 (알림, 감사로그, 테넌트 격리)

> Wave 3 완료 후 진행 가능. F16~F18 구현.

### 파일 목록

**인앱 알림 (F16)**
| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/services/notification.service.ts` | 알림 생성, 목록 조회, 읽음 처리 | `db/index.ts`, `types/index.ts` |
| `src/app/api/notifications/route.ts` | GET(목록), PATCH(전체 읽음) | `notification.service.ts` |
| `src/app/api/notifications/[id]/read/route.ts` | PATCH — 단일 읽음 처리 | `notification.service.ts` |
| `src/components/notifications/NotificationItem.tsx` | 알림 항목 (읽음/미읽음, 타입 아이콘) | `types/index.ts` |
| `src/components/notifications/NotificationList.tsx` | 알림 목록 (전체읽음 버튼) | `NotificationItem.tsx` |
| `src/app/(main)/notifications/page.tsx` | 알림 페이지 | `NotificationList.tsx` |

**알림 생성 통합 (기존 파일 수정)**
| 파일 | 수정 내용 |
|------|----------|
| `src/services/ticket.service.ts` | 담당자 배정 시 알림 생성 (`notification.service.createNotification()`) |
| `src/services/ticket.service.ts` | 상태 변경 시 알림 생성 |

**감사로그 (F17)**
| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/services/audit.service.ts` | 감사로그 기록, 목록 조회 (필터: 사용자/액션/날짜범위) | `db/index.ts`, `types/index.ts` |
| `src/lib/audit.middleware.ts` | 서비스 레이어에서 호출하는 감사로그 헬퍼 함수 | `audit.service.ts` |
| `src/app/api/audit/route.ts` | GET(목록, admin 전용) | `audit.service.ts` |
| `src/components/audit/AuditLogTable.tsx` | 감사로그 테이블 (who/what/when) | `types/index.ts` |
| `src/app/(main)/settings/audit/page.tsx` | 감사로그 페이지 (admin 전용) | `AuditLogTable.tsx` |

**감사로그 통합 (기존 파일 수정)**
| 파일 | 수정 내용 |
|------|----------|
| `src/services/ticket.service.ts` | CRUD/상태변경/담당자배정 시 감사로그 기록 |
| `src/services/kb.service.ts` | CRUD 시 감사로그 기록 |
| `src/services/rule.service.ts` | CRUD/토글 시 감사로그 기록 |
| `src/services/user.service.ts` | 역할변경 시 감사로그 기록 |

**테넌트 격리 강화 (F18)**
| 파일 | 수정 내용 |
|------|----------|
| `src/lib/tenant.ts` | 현재 세션의 tenant_id 추출 헬퍼, 서비스 레이어 공통 tenant_id 주입 유틸 |
| 모든 service 파일 | tenant_id 필터 누락 여부 점검 및 보완 |

### 태스크 분해

**Task 6-A: 알림 서비스 & API**
- `src/services/notification.service.ts`
- `src/app/api/notifications/route.ts`
- `src/app/api/notifications/[id]/read/route.ts`

**Task 6-B (6-A와 병렬 가능): 알림 UI**
- `src/components/notifications/NotificationItem.tsx`
- `src/components/notifications/NotificationList.tsx`
- `src/app/(main)/notifications/page.tsx`
- Header.tsx에 미읽음 알림 카운트 배지 통합

**Task 6-C (6-A와 독립적): 감사로그 서비스 & API**
- `src/services/audit.service.ts`
- `src/lib/audit.middleware.ts`
- `src/app/api/audit/route.ts`

**Task 6-D (6-C와 병렬 가능): 감사로그 UI**
- `src/components/audit/AuditLogTable.tsx`
- `src/app/(main)/settings/audit/page.tsx`

**Task 6-E (6-A + 6-C 완료 후): 서비스 통합**
- `src/lib/tenant.ts` 작성
- ticket/kb/rule/user 서비스에 알림 생성 & 감사로그 기록 추가
- tenant_id 격리 전수 점검

---

## Wave 7: 대시보드 & 최종 통합

> 모든 이전 Wave 완료 후 진행. F08 구현 + 전체 UI 폴리싱.

### 파일 목록

| 파일 | 역할 | 의존성 |
|------|------|--------|
| `src/app/api/dashboard/route.ts` | GET — 상태별 카운트, 우선순위 분포, 최근 티켓 10건 집계 쿼리 | `db/index.ts` |
| `src/components/dashboard/StatsCard.tsx` | 숫자 통계 카드 (total/open/in_progress 등) | `types/index.ts` |
| `src/components/dashboard/StatusChart.tsx` | 상태별 분포 파이/도넛 차트 (Recharts) | `types/index.ts` |
| `src/components/dashboard/PriorityChart.tsx` | 우선순위 분포 바 차트 (Recharts) | `types/index.ts` |
| `src/components/dashboard/RecentTickets.tsx` | 최근 티켓 테이블 | `types/index.ts` |
| `src/app/(main)/dashboard/page.tsx` | 대시보드 페이지 (로그인 후 기본 랜딩) | 위 컴포넌트 전체 |

**전체 통합 확인 (코드 수정 최소)**
| 확인 항목 | 관련 파일 |
|----------|----------|
| 로그인 후 `/dashboard` 자동 리다이렉트 | `middleware.ts`, `login/page.tsx` |
| admin 전용 메뉴 숨김 (Sidebar) | `Sidebar.tsx` |
| 모든 API 역할 체크 누락 여부 | 각 `route.ts` |
| 빈 상태(empty state) UI | 각 목록 페이지 |
| 에러 경계 & 로딩 상태 | 각 페이지 (`loading.tsx`, `error.tsx`) |

### 태스크 분해

**Task 7-A: 대시보드 API**
- `src/app/api/dashboard/route.ts` — 집계 쿼리 작성

**Task 7-B (7-A와 병렬 가능): 대시보드 컴포넌트**
- `src/components/dashboard/StatsCard.tsx`
- `src/components/dashboard/StatusChart.tsx` (Recharts)
- `src/components/dashboard/PriorityChart.tsx` (Recharts)
- `src/components/dashboard/RecentTickets.tsx`

**Task 7-C (7-A + 7-B 완료 후): 대시보드 페이지**
- `src/app/(main)/dashboard/page.tsx`
- 로그인 → 대시보드 리다이렉트 동선 확인

**Task 7-D: 전체 통합 점검 & 폴리싱**
- 역할별 접근 제어 전수 확인 (admin/agent/viewer)
- 각 페이지 `loading.tsx` + `error.tsx` 추가
- 빈 상태 UI (데이터 없을 때) 처리
- 최종 E2E 동선 확인 (로그인 → 티켓 생성 → 룰 자동실행 → 알림 → 대시보드 반영)

---

## Wave 의존성 요약

```
Wave 1 (기반)
   └── Wave 2 (인증/사용자)
         └── Wave 3 (티켓 핵심)
               ├── Wave 4 (티켓확장 + KB)    ← Wave 4, 5, 6은 서로 병렬 가능
               ├── Wave 5 (룰 엔진)
               └── Wave 6 (알림/감사로그)
                                              └── Wave 7 (대시보드 + 통합) ← 모두 완료 후
```

## 파일 충돌 위험 구간

| 구간 | 충돌 위험 파일 | 해결책 |
|------|-------------|--------|
| Wave 5-C / Wave 6-E | `src/services/ticket.service.ts` | 한 사람이 담당, 나머지는 PR 대기 |
| Wave 6-E (tenant 점검) | 모든 service 파일 | Wave 6-A~D 완료 후 1인이 일괄 처리 |
| Wave 7-D (폴리싱) | 각 page.tsx | 기능별 담당자가 각자 자기 파일만 수정 |
