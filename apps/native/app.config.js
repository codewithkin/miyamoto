/**
 * app.json, plus what can't be static (plan 13).
 *
 * Push on Android goes through Firebase Cloud Messaging, and the build needs
 * the Firebase project's google-services.json to get a push token at all.
 * Pointing app.json at a file that doesn't exist fails the build, and until
 * the owner creates the Firebase project there is no file. So it's added
 * only when it's there:
 *
 *   - locally: apps/native/google-services.json;
 *   - on EAS: an environment variable of type "file" named
 *     GOOGLE_SERVICES_JSON, which EAS turns into a path.
 *
 * Without it, everything else works. Letters still reach an app that's in
 * the background, and only a closed app goes without (lib/letters).
 */
const fs = require("node:fs");
const path = require("node:path");

module.exports = ({ config }) => {
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON ?? path.join(__dirname, "google-services.json");
  const hasFirebase = fs.existsSync(googleServicesFile);

  return {
    ...config,
    android: {
      ...config.android,
      ...(hasFirebase ? { googleServicesFile } : {}),
    },
  };
};
