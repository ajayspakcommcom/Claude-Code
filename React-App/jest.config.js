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
};
