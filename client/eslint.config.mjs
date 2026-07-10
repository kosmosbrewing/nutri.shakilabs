import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import globals from "globals";
import vuePlugin from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

const commonRules = {
  "no-debugger": "error",
  "@typescript-eslint/no-unused-vars": [
    "error",
    { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
  ],
};

function restrictImports(files, patterns) {
  return {
    files,
    rules: {
      "no-restricted-imports": ["error", { patterns }],
    },
  };
}

export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-debugger": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: commonRules,
  },
  {
    files: ["src/**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
        extraFileExtensions: [".vue"],
      },
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: { "@typescript-eslint": tsPlugin, vue: vuePlugin },
    rules: {
      ...commonRules,
      "vue/multi-word-component-names": "off",
      "vue/no-unused-vars": "error",
    },
  },
  restrictImports(["src/data/**/*.{ts,vue}"], [
    "@/utils/*",
    "@/composables/*",
    "@/components/*",
    "@/views/*",
  ]),
  restrictImports(["src/utils/**/*.{ts,vue}"], [
    "@/composables/*",
    "@/components/*",
    "@/views/*",
  ]),
  restrictImports(["src/composables/**/*.{ts,vue}"], [
    "@/components/*",
    "@/views/*",
  ]),
  restrictImports(["src/components/**/*.{ts,vue}"], ["@/views/*"]),
  restrictImports(["src/{api,lib}/**/*.{ts,vue}"], [
    "@/data/*",
    "@/utils/*",
    "@/composables/*",
    "@/components/*",
    "@/views/*",
  ]),
];
