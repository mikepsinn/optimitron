import { NotFoundPage } from "@optimitron/site-kit/components/not-found";
import { NavigationProvider } from "@optimitron/site-kit/components/navigation-provider";
import { appNavigation } from "../lib/navigation";

// Next.js can render this boundary without the app root layout.
export default function NotFound() {
  return <NavigationProvider navigation={appNavigation}><NotFoundPage /></NavigationProvider>;
}
