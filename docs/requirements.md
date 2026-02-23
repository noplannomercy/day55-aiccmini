# AICC Mini - SRS (Software Requirements Specification)

## 1. Project Overview

**Name**: AICC Mini - 고객지원 티켓 + 지식베이스 + 자동화
**Level**: 4-5
**Day**: 55

고객지원 티켓 관리, 지식베이스, 자동 분류/라우팅 룰 엔진을 갖춘 미니 AICC 시스템.
멀티테넌트(tenant_id 기반), 역할별 접근 제어, 감사로그 포함.

## 2. Tech Stack

- Framework: Next.js 15 (App Router)
- Language: TypeScript
- Database: Supabase (hosted PostgreSQL) + Drizzle ORM
- UI: shadcn/ui + Tailwind CSS
- Charts: Recharts (대시보드)
- Auth: Supabase Auth (Google OAuth + mock-login)

## 3. Entities (8)

| # | Entity | Description |
|---|--------|-------------|
| 1 | Tenant | 조직/회사 단위 격리 |
| 2 | User | 사용자 (admin/agent/viewer) |
| 3 | Customer | 고객 (티켓 요청자) |
| 4 | Ticket | 지원 티켓 |
| 5 | TicketComment | 티켓 댓글/내부메모 |
| 6 | KBArticle | 지식베이스 문서 |
| 7 | AutoRule | 자동화 룰 (조건→액션) |
| 8 | AuditLog | 감사로그 |

## 4. Features (22)

### 4.1 Core - 티켓 관리 (8)

| # | Feature | Description |
|---|---------|-------------|
| F01 | 티켓 CRUD | 생성/조회/수정/삭제 |
| F02 | 상태 변경 | open → in_progress → resolved → closed |
| F03 | 우선순위 | low / medium / high / urgent |
| F04 | 담당자 배정 | agent 역할 사용자에게 배정 |
| F05 | 댓글 추가 | 티켓에 댓글/내부메모 작성 |
| F06 | 첨부파일 메타 | URL 기반 첨부 (파일 업로드 X) |
| F07 | 티켓 필터/검색 | 상태/우선순위/담당자/키워드 필터 |
| F08 | 대시보드 | 상태별 카운트, 우선순위 분포, 최근 티켓 |

### 4.2 지식베이스 (4)

| # | Feature | Description |
|---|---------|-------------|
| F09 | KB 문서 CRUD | 생성/조회/수정/삭제 |
| F10 | 태그 관리 | 문서에 태그 추가/제거 |
| F11 | 키워드 검색 | 제목/본문 키워드 검색 |
| F12 | 문서 버전 | version number + updated_at 추적 |

### 4.3 자동화 룰 엔진 (3)

| # | Feature | Description |
|---|---------|-------------|
| F13 | 룰 CRUD | 조건(키워드/우선순위) → 액션(담당자배정/상태변경) |
| F14 | 자동 실행 | 티켓 생성 시 매칭 룰 자동 실행 |
| F15 | 룰 토글 | 룰 활성/비활성 on/off |

### 4.4 시스템 (4)

| # | Feature | Description |
|---|---------|-------------|
| F16 | 인앱 알림 | 티켓 배정/상태변경 시 알림 생성 |
| F17 | 감사로그 | 주요 액션 자동 기록 (who/what/when) |
| F18 | 테넌트 격리 | tenant_id 기반 데이터 격리 |
| F19 | 역할 관리 | admin(전체) / agent(티켓처리) / viewer(읽기전용) |

### 4.5 인증 (3)

| # | Feature | Description |
|---|---------|-------------|
| F20 | 로그인/로그아웃 | Supabase Auth Google OAuth |
| F21 | 역할별 접근 제어 | 페이지/API별 역할 체크 |
| F22 | Mock Login | 개발/테스트용 mock-login API |

## 5. Pages

| Page | Path | 역할 | Features |
|------|------|------|----------|
| 로그인 | /login | all | F20, F22 |
| 대시보드 | /dashboard | all | F08 |
| 티켓 목록 | /tickets | agent+ | F01, F07 |
| 티켓 상세 | /tickets/[id] | agent+ | F02-F06 |
| 티켓 생성 | /tickets/new | agent+ | F01, F14 |
| KB 목록 | /kb | all | F09, F11 |
| KB 상세 | /kb/[id] | all | F09, F12 |
| KB 편집 | /kb/[id]/edit | agent+ | F09, F10 |
| 룰 관리 | /settings/rules | admin | F13, F15 |
| 사용자 관리 | /settings/users | admin | F19 |
| 알림 | /notifications | all | F16 |
| 감사로그 | /settings/audit | admin | F17 |

## 6. Excluded (라이트 스코프에서 제외)

- 벡터 검색 / RAG
- 이메일/슬랙 외부 알림
- SLA 타이머/에스컬레이션
- 파일 업로드 (S3 등)
- 멀티테넌트 완전 격리 (스키마 분리)
- 실시간 채팅/WebSocket
- AI 자동 응답 생성