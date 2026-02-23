다음 문서들을 PostgreSQL(Docker) → Supabase 기반으로 일괄 수정해줘.

## 변경 사항

**인프라 변경:**
- Docker PostgreSQL 제거 → Supabase (hosted PostgreSQL) 사용
- docker-compose.yml 불필요 → 삭제 또는 제거
- DB 연결: Supabase connection string (DATABASE_URL)
- 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 불필요 — Drizzle ORM으로 직접 연결하므로 DATABASE_URL만 사용

**유지 사항 (변경 금지):**
- Drizzle ORM 그대로 유지 (Supabase JS SDK 사용 안 함)
- 스키마 구조, 엔티티, 필드 전부 동일
- JSONB, text[], uuid 네이티브 사용 (Supabase = PostgreSQL이므로)
- NextAuth.js 인증 방식 동일
- 서비스 레이어 패턴 동일

**수정 대상 파일:**
1. `SRS.md` — Tech Stack에서 Docker → Supabase
2. `docs/IMPLEMENTATION.md` — Wave 1 인프라 설정 (docker-compose → Supabase 프로젝트 생성 + DATABASE_URL 설정 + drizzle-kit push)
3. `CLAUDE.md` — 빌드 명령어, 환경변수, 데이터 저장 패턴
4. `docs/ARCHITECTURE.md` — 프로젝트 구조에서 docker-compose.yml 제거, DB 연결 설명
5. `docs/DATABASE.md` — 연결 방식 설명 (Supabase hosted PostgreSQL)

**Wave 1 Task 1-A 수정 내용:**
- 기존: docker-compose.yml 작성 → Docker PostgreSQL 기동
- 변경: Supabase 프로젝트 생성 → .env.local에 DATABASE_URL 설정 → drizzle-kit push

코드 작성하지 마. 문서 수정만.