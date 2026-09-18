// Build/review tooling may inventory every app; runtime shared packages must not.
import { appNavigation as acceleratedMedicine } from "../apps/acceleratedmedicine/lib/navigation";
import { appNavigation as courtOfHumanity } from "../apps/courtofhumanity/lib/navigation";
import { appNavigation as cureDao } from "../apps/curedao/lib/navigation";
import { appNavigation as dfda } from "../apps/dfda/lib/navigation";
import { appNavigation as survey } from "../apps/trialabundancesurvey/lib/navigation";
import { appNavigation as warOnDisease } from "../apps/warondisease/lib/navigation";
import { appNavigation as wishocracy } from "../apps/wishocracy/lib/navigation";
import { getInternalNavigationRoutes, type AppNavigation } from "../packages/site-kit/src/lib/app-navigation";
import { VARIANTS, type SiteVariant } from "../packages/site-kit/src/lib/site-variant-types";

const navigationByVariant: Partial<Record<SiteVariant, AppNavigation>> = {
  [VARIANTS.ACCELERATED_MEDICINE]: acceleratedMedicine,
  [VARIANTS.COURT_OF_HUMANITY]: courtOfHumanity,
  [VARIANTS.CUREDAO]: cureDao,
  [VARIANTS.DFDA]: dfda,
  [VARIANTS.SURVEY]: survey,
  [VARIANTS.WAR_ON_DISEASE]: warOnDisease,
  [VARIANTS.WISHOCRACY]: wishocracy,
};

export function getInternalNavigationRoutesForVariant(variant: SiteVariant) {
  const navigation = navigationByVariant[variant];
  if (!navigation) throw new Error(`No standalone app navigation for ${variant}`);
  return getInternalNavigationRoutes(navigation);
}
