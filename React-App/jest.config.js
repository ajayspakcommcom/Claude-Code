/** @type {import('jest').Config} */
module.exports = {
  // Use ts-jest to transform TypeScript files
  preset: "ts-jest",

  // jsdom simulates a browser environment (document, window, etc.)
  testEnvironment: "jest-environment-jsdom",

  // Run this file before every test — sets up @testing-library/jest-dom matchers
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],

  // Tell Jest how to resolve .tsx/.ts files
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],

  // Transform TypeScript using ts-jest
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {
      tsconfig: {
        jsx: "react-jsx",
        esModuleInterop: true,
        skipLibCheck: true,
      },
    }],
  },

  // Mock CSS module imports so they don't crash in test environment
  moduleNameMapper: {
    "\\.module\\.css$": "<rootDir>/src/__mocks__/styleMock.js",
    "\\.css$":          "<rootDir>/src/__mocks__/styleMock.js",
  },

  // Where to find tests
  testMatch: ["<rootDir>/src/**/*.test.tsx", "<rootDir>/src/**/*.test.ts"],

  // ─── Coverage ────────────────────────────────────────────────────────────────
  // Run:  npm test -- --coverage   or   npm run test:coverage
  //
  // collectCoverageFrom — which files to measure (exclude config/mock files)
  // coverageThresholds  — CI will FAIL if coverage drops below these numbers
  //                       Enterprise standard: 80% minimum, aim for 90%+

  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",       // exclude test files themselves
    "!src/**/__mocks__/**",           // exclude mock files
    "!src/setupTests.ts",             // exclude setup file
    "!src/index.tsx",                 // exclude entry point (untestable in isolation)
    "!src/**/index.ts",               // exclude barrel re-exports
  ],

  coverageThreshold: {
    global: {
      branches:  70,   // % of if/else branches executed
      functions: 75,   // % of functions called
      lines:     75,   // % of lines executed
      statements: 75,  // % of statements executed
    },
    // Per-file threshold — any single file below 60% fails CI
    // Uncomment to enable stricter per-file enforcement:
    // "./src/intermediate/testing/04_CustomRender.tsx": {
    //   lines: 90,
    // },
  },

  coverageReporters: [
    "text",           // print to terminal
    "lcov",           // generates lcov.info for tools like Codecov / SonarQube
    "html",           // generates coverage/ folder — open in browser
  ],

  // Coverage output directory
  coverageDirectory: "coverage",
};
