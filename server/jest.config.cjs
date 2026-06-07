/**
 * The server ships as native ESM ("type": "module") with .js-suffixed relative
 * imports. For tests we compile each .ts to CommonJS via ts-jest so the classic
 * hoisted jest.mock() works, and strip the .js suffix from relative imports so
 * they resolve to the .ts sources under Jest.
 */
module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.cjs"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: false,
        tsconfig: {
          module: "commonjs",
          moduleResolution: "node",
          verbatimModuleSyntax: false,
          esModuleInterop: true,
          isolatedModules: true,
        },
      },
    ],
  },
};
