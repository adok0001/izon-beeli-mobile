import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // Debt-prevention gates: warn so pre-existing violations don't break the build,
  // but new `any` usage and new 500+ line files get flagged going forward. The
  // strict gate is enforced in CI on PR-changed files only (see .github/workflows/ci.yml).
  // landing/marketing are content-heavy by nature and exempt from the size cap.
  {
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
    ignores: ["components/landing/**", "components/marketing/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "max-lines": ["warn", { max: 500, skipBlankLines: true, skipComments: true }],
    },
  },
];

export default eslintConfig;
