export function createAppEslintConfig(tseslint, tsparser) {
  return [
    {
      ignores: [
        ".next/**",
        "node_modules/**",
        "dist/**",
        "build/**",
        "*.config.js",
        "*.config.mjs",
        "*.config.ts",
        "public/**",
        "prisma/**",
        "scripts/**",
        "tests/**",
        "**/*.test.*",
        "**/*.spec.*",
      ],
    },
    {
      files: ["**/*.{js,jsx}"],
      languageOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
        },
      },
      rules: {
        "no-unused-vars": "off",
        "no-console": "off",
        "no-undef": "error",
      },
    },
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: {
        parser: tsparser,
        ecmaVersion: "latest",
        sourceType: "module",
        parserOptions: {
          ecmaFeatures: {
            jsx: true,
          },
          project: "./tsconfig.json",
        },
      },
      plugins: {
        "@typescript-eslint": tseslint,
      },
      rules: {
        "no-unused-vars": "off",
        "@typescript-eslint/no-unused-vars": [
          "warn",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
        "no-console": "off",
        "no-undef": "off",
      },
    },
  ]
}
