// ESLint flat config (v9+)
// Replaces the old .eslintrc.js format

const js = require("@eslint/js");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const a11yPlugin = require("eslint-plugin-jsx-a11y");
const prettierPlugin = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");

module.exports = [
  // ── Global ignores ──────────────────────────────────────────────────────────
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**"],
  },

  // ── JavaScript base ─────────────────────────────────────────────────────────
  js.configs.recommended,

  // ── TypeScript + React files ─────────────────────────────────────────────────
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        React: "readonly",
        window: "readonly",
        document: "readonly",
        console: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        fetch: "readonly",
        Promise: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "jsx-a11y": a11yPlugin,
      prettier: prettierPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // ── Prettier integration ─────────────────────────────────────────────────
      "prettier/prettier": "warn",

      // ── TypeScript ───────────────────────────────────────────────────────────
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off", // too noisy for React
      "@typescript-eslint/no-non-null-assertion": "warn",

      // ── React ────────────────────────────────────────────────────────────────
      "react/jsx-uses-react": "off",           // not needed with React 17+ JSX transform
      "react/react-in-jsx-scope": "off",        // same
      "react/prop-types": "off",               // TypeScript handles this
      "react/display-name": "warn",            // helps with DevTools debugging
      "react/no-danger": "warn",               // flag dangerouslySetInnerHTML usage
      "react/no-array-index-key": "warn",      // prefer stable keys over index
      "react/self-closing-comp": "warn",       // <Component /> not <Component></Component>
      "react/jsx-no-target-blank": "error",    // require rel="noopener noreferrer"

      // ── React Hooks ──────────────────────────────────────────────────────────
      "react-hooks/rules-of-hooks": "error",   // only call hooks at top level
      "react-hooks/exhaustive-deps": "warn",   // all deps in dependency arrays

      // ── Accessibility ────────────────────────────────────────────────────────
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/interactive-supports-focus": "warn",

      // ── General code quality ─────────────────────────────────────────────────
      "no-console": "warn",                    // use a logger in production
      "no-debugger": "error",
      "no-var": "error",                       // always use const/let
      "prefer-const": "warn",
      "eqeqeq": ["error", "always"],          // === not ==
      "no-duplicate-imports": "error",
      "no-unused-vars": "off",                // replaced by @typescript-eslint/no-unused-vars
    },
  },

  // ── Prettier config (disables conflicting formatting rules) ──────────────────
  prettierConfig,
];
