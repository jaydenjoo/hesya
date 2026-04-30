/**
 * commitlint — 커밋 메시지 형식 검증
 *
 * 형식: <type>: <description>
 * 예시:
 *   feat: 사용자 프로필 페이지 추가
 *   fix: 결제 이중 호출 방지
 *   refactor: DAL 패턴으로 쿼리 통합
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // 새 기능
        "fix", // 버그 수정
        "refactor", // 리팩터링
        "docs", // 문서
        "test", // 테스트
        "chore", // 잡일 (deps, config 등)
        "perf", // 성능
        "ci", // CI/CD
        "style", // 코드 스타일 (포맷)
      ],
    ],
    "subject-case": [0], // 한글 허용
    "subject-max-length": [2, "always", 100],
  },
};
