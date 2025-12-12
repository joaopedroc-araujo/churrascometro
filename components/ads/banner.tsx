import { usePremium } from "@/contexts/premium-context";
import Constants from "expo-constants";
import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";

// Verificar se o módulo nativo está disponível
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
let isAdsAvailable = false;

try {
  const mobileAds = require("react-native-google-mobile-ads");
  BannerAd = mobileAds.BannerAd;
  BannerAdSize = mobileAds.BannerAdSize;
  TestIds = mobileAds.TestIds;
  isAdsAvailable = true;
} catch {
  // Módulo não disponível (Expo Go)
  isAdsAvailable = false;
}

// IDs de teste por plataforma
const getTestBannerId = () => {
  if (!TestIds) {return "";}
  return Platform.select({
    android: TestIds.ADAPTIVE_BANNER,
    ios: TestIds.ADAPTIVE_BANNER,
    default: TestIds.ADAPTIVE_BANNER,
  });
};

const getAdUnitId = (): string => {
  if (!isAdsAvailable) {return "";}

  // Em desenvolvimento, usar IDs de teste
  if (__DEV__) {
    return getTestBannerId();
  }

  // Try to get the ad unit ID from app config
  const configAdUnitId = Constants.expoConfig?.extra?.adMobBannerUnitId;

  if (configAdUnitId) {
    return configAdUnitId;
  }

  // Fallback to test IDs
  return getTestBannerId();
};

interface AdBannerProps {
  size?: any;
}

export function AdBanner({ size }: AdBannerProps) {
  // Se os anúncios não estiverem disponíveis, não renderizar nada
  if (!isAdsAvailable || !BannerAd) {
    return null;
  }

  const adUnitId = getAdUnitId();
  const bannerSize = size || BannerAdSize?.ANCHORED_ADAPTIVE_BANNER;

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={adUnitId}
        size={bannerSize}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

// Componente de banner fixo na parte inferior
export function BottomAdBanner() {
  const { isPremium } = usePremium();

  // Se é premium, não mostrar anúncios
  if (isPremium) {
    return null;
  }

  // Se os anúncios não estiverem disponíveis, mostrar placeholder em dev
  if (!isAdsAvailable) {
    if (__DEV__) {
      return (
        <View style={[styles.bottomContainer, styles.placeholder]}>
          <Text style={styles.placeholderText}>📢 Anúncio (Dev Build necessário)</Text>
        </View>
      );
    }
    return null;
  }

  return (
    <View style={styles.bottomContainer}>
      <AdBanner size={BannerAdSize?.ANCHORED_ADAPTIVE_BANNER} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A1A2E",
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  placeholder: {
    paddingVertical: 12,
    backgroundColor: "#16213E",
    borderTopWidth: 1,
    borderTopColor: "#2A2A4E",
  },
  placeholderText: {
    color: "#A0A0A0",
    fontSize: 12,
  },
});
