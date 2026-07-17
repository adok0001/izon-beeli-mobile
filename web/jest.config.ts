import type { Config } from "jest";
import nextJest from "next/jest.js";

// next/jest wires up SWC transform, next.config, and .env loading for us.
const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    // Mirror tsconfig paths so tests resolve the same imports as the app.
    "^@/(.*)$": "<rootDir>/$1",
    "^@mobile/(.*)$": "<rootDir>/../mobile/$1",
  },
  testMatch: ["<rootDir>/**/__tests__/**/*.test.{ts,tsx}"],
};

// createJestConfig also transforms sibling-package (../mobile) TS via SWC, since
// those files live outside node_modules and are reachable through @mobile/*.
export default createJestConfig(config);
