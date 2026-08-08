/**
 * Fixed single-app brand. This package never multi-hosts other variants.
 * Cross-domain links use absolute https URLs, not site-variant switching.
 */
import type { SiteVariant } from "./site-variant-types"
import { VARIANTS } from "./site-variant-types"

export const APP_BRAND: SiteVariant = VARIANTS.WAR_ON_DISEASE
export const APP_PORT = 3010
export const APP_PACKAGE_NAME = "@apps/warondisease"
