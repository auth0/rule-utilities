module.exports = {
  "testEnvironment": "node",
  "collectCoverageFrom": [
    "lib/**/*.{ts,tsx,js,jsx}",
    "api/**/*.{ts,tsx,js,jsx}"
  ],
  "coverageDirectory": "./coverage",
  "coveragePathIgnorePatterns": [
    "coverage/",
    "node_modules/",
    "public/",
    "esm/",
    "lib/",
    "tmp/",
    "dist/"
  ],
  "coverageReporters": [
    "lcov",
    "json-summary",
    "html",
    "text"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 75,
      "functions": 75,
      "lines": 75,
      "statements": 75
    }
  },
  "resetMocks": true
};