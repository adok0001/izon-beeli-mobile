// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const HEX_PATTERN = /^#[0-9a-fA-F]{3,8}$/;
const EXEMPT_HEX = new Set([
  // Transparent/white/black shorthands that are always safe:
  "#fff", "#FFF", "#000", "#000000", "#ffffff", "#FFFFFF",
]);

/** @type {import('eslint').Rule.RuleModule} */
const noRawHexRule = {
  meta: { type: "suggestion", schema: [] },
  create(context) {
    function check(node, name) {
      if (
        node.type === "Literal" &&
        typeof node.value === "string" &&
        HEX_PATTERN.test(node.value) &&
        !EXEMPT_HEX.has(node.value)
      ) {
        context.report({
          node,
          message: `Hardcoded hex '${node.value}' in '${name}'. Use a Museum token (M.*) or getAccent() instead.`,
        });
      }
    }

    return {
      // style={{ color: "#hex" }}  and  style={{ backgroundColor: "#hex" }}
      Property(node) {
        if (
          node.key.type === "Identifier" &&
          /^(color|backgroundColor|borderColor|tintColor|shadowColor|borderTopColor|borderBottomColor|borderLeftColor|borderRightColor)$/.test(node.key.name)
        ) {
          check(node.value, node.key.name);
        }
      },
      // color="#hex" (JSX attribute string literal)
      JSXAttribute(node) {
        if (
          node.name.type === "JSXIdentifier" &&
          /^(color|backgroundColor|tintColor)$/.test(node.name.name) &&
          node.value?.type === "Literal"
        ) {
          check(node.value, node.name.name);
        }
        // color={"#hex"}
        if (
          node.name.type === "JSXIdentifier" &&
          /^(color|backgroundColor|tintColor)$/.test(node.name.name) &&
          node.value?.type === "JSXExpressionContainer" &&
          node.value.expression?.type === "Literal"
        ) {
          check(node.value.expression, node.name.name);
        }
      },
    };
  },
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    plugins: { 'beeli-design': { rules: { 'no-raw-hex': noRawHexRule } } },
    rules: {
      'beeli-design/no-raw-hex': 'warn',
    },
  },
  // Debt-prevention gates: warn so existing violations don't break the build,
  // but new `any` usage and new 500+ line files get flagged going forward.
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}'],
    ignores: ['lib/data/**', 'lib/locales/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'max-lines': ['warn', { max: 500, skipBlankLines: true, skipComments: true }],
    },
  },
]);
