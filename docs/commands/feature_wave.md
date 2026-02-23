CLAUDE.md와 docs/ 전체 문서를 읽고 Wave $ARGUMENTS 를 실행해.
IMPLEMENTATION.md 기준으로 팀을 자율 구성하고 태스크를 배분해.

제약:
- 코딩 역할은 Opus 사용
- 비코딩 역할(테스트/리뷰/문서)은 Sonnet 또는 Haiku 사용
- tester를 반드시 general-purpose 타입으로 포함 (Bash 타입 금지)
- 문서 담당을 반드시 포함: 변경사항 반영이 필요한 docs/ 문서를 업데이트
- 기존 로직 수정/리팩토링 금지 (함수 추가·UI 확장은 허용)
- 테스트 실패 3개 초과 시 삭제
- docs/TASK-LOG.md에 태스크 배분 + Plan vs Actual 기록
- 완료 후 npm run build + npx playwright test 검증 후 TeamDelete