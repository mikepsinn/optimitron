/** Load optional root values, then let static copy previews run without secrets. */
import "./load-root-env";

process.env.SKIP_ENV_VALIDATION ??= "true";
