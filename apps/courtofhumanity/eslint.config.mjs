import tseslint from "@typescript-eslint/eslint-plugin"
import tsparser from "@typescript-eslint/parser"
import { createAppEslintConfig } from "../shared-eslint-config.mjs"

export default createAppEslintConfig(tseslint, tsparser)
