import Constants from "expo-constants";
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

const getAdUnitId = (): string => {
  // Try to get the ad unit ID from app config
  const configAdUnitId = Constants.expoConfig?.extra?.adMobBannerUnitId;

  if (configAdUnitId) {
    return configAdUnitId;
  }

  // Fallback to test IDs
  return TestIds.ADAPTIVE_BANNER;
};

interface AdBannerProps {
  size?: BannerAdSize;
}

export function AdBanner({
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}: AdBannerProps) {
  const adUnitId = getAdUnitId();

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={size}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
});

export default AdBanner;
