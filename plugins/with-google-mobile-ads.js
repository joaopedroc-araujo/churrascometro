const { withAndroidManifest, withInfoPlist } = require("@expo/config-plugins");

const withGoogleMobileAds = (config, { androidAppId, iosAppId }) => {
  // Configure Android
  config = withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];

    if (mainApplication) {
      // Initialize meta-data array if it doesn't exist
      if (!mainApplication["meta-data"]) {
        mainApplication["meta-data"] = [];
      }

      // Add Google Mobile Ads App ID
      mainApplication["meta-data"].push({
        $: {
          "android:name": "com.google.android.gms.ads.APPLICATION_ID",
          "android:value": androidAppId,
        },
      });
    }

    return config;
  });

  // Configure iOS
  config = withInfoPlist(config, (config) => {
    config.modResults.GADApplicationIdentifier = iosAppId;
    return config;
  });

  return config;
};

module.exports = withGoogleMobileAds;
