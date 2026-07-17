import tseslint from "typescript-eslint";

// Minimal debt-prevention gate for the server (mirrors mobile/eslint.config.js):
// register the TS parser/plugin via the `base` config (no noisy recommended
// ruleset), then warn on new `any` usage and new 500+ line files. `warn` keeps
// pre-existing debt from breaking the build; CI enforces the gate on PR-changed
// files only, at --max-warnings 0 (see .github/workflows/ci.yml).
//
// seed/db scripts are CLI tools (deliberate console output, long data files) and
// __tests__ carry their own patterns — both exempt from the size cap.
export default tseslint.config(
  { ignores: ["dist/**"] },
  {
    files: ["src/**/*.ts"],
    ignores: ["src/seed/**", "src/db/**", "src/**/__tests__/**"],
    extends: [tseslint.configs.base],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "max-lines": ["warn", { max: 500, skipBlankLines: true, skipComments: true }],
    },
  },
);
