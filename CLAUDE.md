# AICC Mini

고객지원 티켓 관리 + 지식베이스 + 자동화 룰 엔진. 멀티테넌트, 역할 기반 접근 제어.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Server Components 기본)
- **Language**: TypeScript (strict mode)
- **DB**: Supabase (hosted PostgreSQL) + Drizzle ORM
- **Auth**: Supabase Auth (Google OAuth + mock credentials)
- **UI**: shadcn/ui + Tailwind CSS
- **Charts**: Recharts

## Build Commands

```bash
# 1. Supabase 프로젝트 생성 후 .env.local에 DATABASE_URL(Session pooler), NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY 설정
#    DATABASE_URL 형식: postgresql://postgres.[PROJECT_ID]:[PASSWORD]@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres
npm install
npm run db:push               # 스키마 마이그레이션 (Supabase DB에 적용)
npm run db:seed               # 초기 데이터 (admin@aicc.demo / AICC Demo 테넌트)
npm run dev                   # 개발 서버 (http://localhost:3000)
npm run build && npm start    # 프로덕션
```

## File Structure Rules

```
src/
  app/
    (auth)/          # 인증 레이아웃 그룹 (로그인)
    (main)/          # 메인 앱 레이아웃 그룹
      [domain]/      # 각 도메인 페이지
    api/             # Route Handlers만
  components/
    layout/          # Sidebar, Header, MainLayout
    [domain]/        # 도메인별 컴포넌트
    ui/              # shadcn/ui 컴포넌트 (수정 금지)
  lib/
    db/              # schema.ts, index.ts, seed.ts
    auth.ts          # Supabase Auth 헬퍼 (createServerClient, createBrowserClient, getSessionUser)
    utils.ts         # cn(), 날짜 포맷, 페이지네이션
    errors.ts        # AppError, NotFoundError, ForbiddenError
  services/          # 비즈니스 로직 (DB 직접 접근 허용 위치)
  types/index.ts     # 공통 TypeScript 타입
  proxy.ts           # 라우트 보호 (Next.js 16 convention)
```

## Coding Conventions

- **서비스 레이어**: 모든 DB 쿼리는 `src/services/` 에서만 실행
- **API Route**: 인증/권한 체크 → 서비스 호출 → JSON 응답만 담당
- **Server Component 기본**: 데이터 패칭은 서버에서, 인터랙션만 `"use client"`
- **tenant_id**: 모든 서비스 함수 첫 번째 인자에 항상 포함
- **에러**: 서비스에서 `AppError` throw → API Route에서 catch → HTTP 상태 코드 매핑
- **네이밍**: 파일 PascalCase(컴포넌트), camelCase(유틸/서비스), kebab-case(라우트 세그먼트)

## Data Storage Pattern

- **멀티테넌트**: 모든 엔티티에 `tenant_id` 컬럼, 쿼리 시 항상 where 조건 포함
- **감사로그**: 서비스 레이어에서 변경 액션 후 `audit.service.log()` 호출
- **알림**: 담당자 배정/상태 변경 후 `notification.service.create()` 호출
- **소프트 삭제 없음**: 실제 DELETE 사용 (감사로그로 추적)
