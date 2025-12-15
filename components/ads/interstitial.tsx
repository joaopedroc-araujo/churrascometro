import { usePremium } from "@/contexts/premium-context";
import Constants from "expo-constants";
import { useCallback, useEffect, useState } from "react";

// Verificar se o módulo nativo está disponível
let AdEventType: any = null;
let InterstitialAd: any = null;
let TestIds: any = null;
let isAdsAvailable = false;

try {
  const mobileAds = require("react-native-google-mobile-ads");
  AdEventType = mobileAds.AdEventType;
  InterstitialAd = mobileAds.InterstitialAd;
  TestIds = mobileAds.TestIds;
  isAdsAvailable = true;
} catch {
  // Módulo não disponível (Expo Go)
  isAdsAvailable = false;
}

// Obter ID do intersticial do app.json ou usar ID de teste
const getInterstitialId = (): string => {
  // Em desenvolvimento, usar IDs de teste
  if (__DEV__ && TestIds) {
    return TestIds.INTERSTITIAL;
  }

  // Em produção, usar ID do app.json
  const configId = Constants.expoConfig?.extra?.adMobInterstitialUnitId;
  if (configId) {
    return configId;
  }

  // Fallback para ID de teste
  return TestIds?.INTERSTITIAL || "";
};

// Criar instância do anúncio intersticial (apenas se disponível)
let interstitial: any = null;
if (isAdsAvailable && InterstitialAd) {
  const adUnitId = getInterstitialId();
  if (adUnitId) {
    interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: true,
    });
  }
}

export function useInterstitialAd() {
  const { isPremium } = usePremium();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    // Se é premium ou o módulo não está disponível, não fazer nada
    if (isPremium || !isAdsAvailable || !interstitial || !AdEventType) {
      return;
    }

    // Listener para quando o anúncio carregar
    const loadedListener = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      setIsLoaded(true);
    });
    ''
    // Listener para quando o anúncio fechar
    const closedListener = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      setIsClosed(true);
      setIsLoaded(false);
      // Recarregar para próxima exibição
      interstitial.load();
    });

    // Carregar o anúncio
    interstitial.load();

    // Cleanup
    return () => {
      loadedListener();
      closedListener();
    };
  }, [isPremium]);

  const showAd = useCallback(() => {
    // Se é premium, não mostrar anúncio
    if (isPremium) {
      return false;
    }

    if (!isAdsAvailable || !interstitial) {
      // Em dev sem módulo nativo, apenas log
      if (__DEV__) {
        console.log("📢 [DEV] Anúncio intersticial seria exibido aqui");
      }
      return false;
    }
    if (isLoaded) {
      interstitial.show();
      return true;
    }
    return false;
  }, [isLoaded, isPremium]);

  const reloadAd = useCallback(() => {
    if (!isAdsAvailable || !interstitial) {
      return;
    }
    setIsLoaded(false);
    setIsClosed(false);
    interstitial.load();
  }, []);

  return {
    isLoaded,
    isClosed,
    showAd,
    reloadAd,
    isAvailable: isAdsAvailable,
  };
}

// Hook para mostrar anúncio após X ações (ex: após compartilhar)
export function useInterstitialAfterActions(actionsBeforeAd: number = 3) {
  const { isLoaded, showAd, reloadAd } = useInterstitialAd();
  const [actionCount, setActionCount] = useState(0);

  const trackAction = useCallback(() => {
    const newCount = actionCount + 1;
    setActionCount(newCount);

    if (newCount >= actionsBeforeAd && isLoaded) {
      showAd();
      setActionCount(0);
      return true;
    }
    return false;
  }, [actionCount, actionsBeforeAd, isLoaded, showAd]);

  return {
    trackAction,
    actionCount,
    isLoaded,
    reloadAd,
  };
}
