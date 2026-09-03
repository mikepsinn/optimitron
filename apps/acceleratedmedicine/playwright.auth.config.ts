import { fileURLToPath } from "node:url"
import { createSurveyAuthConfig } from "../trialabundancesurvey/tests/e2e/config"

export default createSurveyAuthConfig(fileURLToPath(new URL(".", import.meta.url)), "acceleratedmedicine.org")
