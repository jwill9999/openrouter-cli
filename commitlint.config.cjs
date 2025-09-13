module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'subject-case': [0],
    // Allow long auto-generated release notes from semantic-release
    'body-max-line-length': [0],
    'footer-max-line-length': [0],
  },
};
