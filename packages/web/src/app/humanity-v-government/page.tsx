import { permanentRedirect } from "next/navigation";
import { HUMANITY_V_GOVERNMENT_MANUAL_URL } from "@/lib/routes";

export default function HumanityVGovernmentPage() {
  permanentRedirect(HUMANITY_V_GOVERNMENT_MANUAL_URL);
}
