다음 문서들을 NextAuth.js → Supabase Auth 기반으로 일괄 수정해줘.

## 변경 사항

**인증 변경:**
- NextAuth.js 제거 → Supabase Auth 사용
- @auth/nextauth 패키지 불필요
- Google OAuth는 Supabase Dashboard에서 설정
- 세션 관리: Supabase `createServerClient()` / `createBrowserClient()`로 처리
- 환경변수: NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY 추가

**파일 변경:**
- `src/lib/auth.ts` → Supabase 서버/클라이언트 헬퍼 (createServerClient, createBrowserClient)
- `src/app/api/auth/[...nextauth]/route.ts` → 삭제
- `src/app/api/auth/callback/route.ts` → Supabase OAuth 콜백 핸들러 (신규)
- `src/app/api/mock-login/route.ts` → Supabase signInWithPassword (이메일/비번 mock 유지)
- `src/middleware.ts` → Supabase 세션 갱신 + 역할 체크
- 로그인 페이지: Google OAuth → `supabase.auth.signInWithOAuth({ provider: 'google' })`

**유지 사항 (변경 금지):**
- Drizzle ORM으로 DB 접근 (Supabase JS SDK의 DB 기능 안 씀 — Auth만 사용)
- 역할 관리: User 테이블의 role 컬럼 그대로 (admin/agent/viewer)
- 서비스 레이어 패턴 동일
- mock-login 개발용 유지

**역할 체크 패턴 변경:**
- 기존: `getServerSession()` → `session.user.role`
- 변경: `supabase.auth.getUser()` → User 테이블에서 role 조회

**수정 대상 파일:**
1. `SRS.md` — Auth: NextAuth.js → Supabase Auth
2. `docs/IMPLEMENTATION.md` — Wave 1 인증 파일 목록 + Task 1-D 수정, Wave 2 로그인 페이지 수정
3. `CLAUDE.md` — 인증 방식 설명
4. `docs/ARCHITECTURE.md` — API 역할 체크 패턴, 인증 파일 구조
5. `docs/DATABASE.md` — 변경 없음 (User 테이블 동일)

코드 작성하지 마. 문서 수정만.