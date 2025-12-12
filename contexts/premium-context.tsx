import { PurchaseData, purchaseService } from "@/services/purchase-service";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

// Chaves de storage
const PREMIUM_DATA_KEY = "@churrascometro:premium_data";
const PREMIUM_HASH_KEY = "@churrascometro:premium_hash";

// Salt para hash (em produção, usar variável de ambiente)
const HASH_SALT = "churrascometro_2025_secure";

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  purchaseData: PurchaseData | null;
  setPremium: (value: boolean, data?: PurchaseData) => Promise<void>;
  restorePurchase: () => Promise<boolean>;
  validatePurchase: () => Promise<boolean>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PremiumProviderProps {
  children: ReactNode;
}

// Gerar hash de verificação para detectar manipulação
async function generateHash(data: string): Promise<string> {
  const dataWithSalt = `${HASH_SALT}:${data}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    dataWithSalt
  );
  return hash;
}

// Verificar integridade dos dados
async function verifyDataIntegrity(data: string, storedHash: string): Promise<boolean> {
  const calculatedHash = await generateHash(data);
  return calculatedHash === storedHash;
}

export function PremiumProvider({ children }: PremiumProviderProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [purchaseData, setPurchaseData] = useState<PurchaseData | null>(null);

  const loadAndValidatePremiumStatus = useCallback(async () => {
    try {
      console.log("[Premium] Carregando status...");

      // 1. Carregar dados do storage
      const storedData = await AsyncStorage.getItem(PREMIUM_DATA_KEY);
      const storedHash = await AsyncStorage.getItem(PREMIUM_HASH_KEY);

      if (!storedData || !storedHash) {
        console.log("[Premium] Nenhum dado encontrado no storage");
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      // 2. Verificar integridade (detecta manipulação do AsyncStorage)
      const isValid = await verifyDataIntegrity(storedData, storedHash);
      if (!isValid) {
        console.warn("[Premium] ⚠️ Dados corrompidos ou manipulados! Resetando...");
        await clearPremiumData();
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      // 3. Parse dos dados
      const data: PurchaseData = JSON.parse(storedData);
      console.log("[Premium] Dados carregados:", data.productId);

      // 4. Validar com a Play Store (se disponível)
      if (purchaseService.isAvailable()) {
        console.log("[Premium] Validando com Play Store...");
        const validation = await purchaseService.validatePurchase();

        if (validation.isValid) {
          console.log("[Premium] ✅ Compra validada pela Play Store");
          setPurchaseData(validation.purchaseData || data);
          setIsPremium(true);
        } else {
          console.warn("[Premium] ❌ Compra NÃO validada pela Play Store");
          // Compra não existe mais na Play Store = reembolso ou fraude
          await clearPremiumData();
          setIsPremium(false);
        }
      } else {
        // IAP não disponível (Expo Go ou dev), confiar nos dados locais com hash válido
        console.log("[Premium] IAP indisponível, usando dados locais verificados");
        setPurchaseData(data);
        setIsPremium(true);
      }
    } catch (error) {
      console.error("[Premium] Erro ao carregar status:", error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar e validar status premium ao iniciar
  useEffect(() => {
    loadAndValidatePremiumStatus();
  }, [loadAndValidatePremiumStatus]);

  const clearPremiumData = async () => {
    try {
      await AsyncStorage.multiRemove([PREMIUM_DATA_KEY, PREMIUM_HASH_KEY]);
      setPurchaseData(null);
    } catch (error) {
      console.error("[Premium] Erro ao limpar dados:", error);
    }
  };

  const setPremium = async (value: boolean, data?: PurchaseData) => {
    try {
      if (value && data) {
        // Salvar dados da compra com hash de verificação
        const dataString = JSON.stringify(data);
        const hash = await generateHash(dataString);

        await AsyncStorage.setItem(PREMIUM_DATA_KEY, dataString);
        await AsyncStorage.setItem(PREMIUM_HASH_KEY, hash);

        setPurchaseData(data);
        setIsPremium(true);
        console.log("[Premium] ✅ Status premium ativado com dados seguros");
      } else {
        // Limpar dados
        await clearPremiumData();
        setIsPremium(false);
        console.log("[Premium] Status premium desativado");
      }
    } catch (error) {
      console.error("[Premium] Erro ao salvar status:", error);
    }
  };

  // Restaurar compra (para quando o usuário reinstalar o app)
  const restorePurchase = async (): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("[Premium] Tentando restaurar compra...");

      const result = await purchaseService.restorePurchases();

      if (result.success && result.purchaseData) {
        await setPremium(true, result.purchaseData);
        console.log("[Premium] ✅ Compra restaurada com sucesso");
        return true;
      }

      console.log("[Premium] Nenhuma compra para restaurar");
      return false;
    } catch (error) {
      console.error("[Premium] Erro ao restaurar:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Validar compra manualmente (pode ser chamado periodicamente)
  const validatePurchase = async (): Promise<boolean> => {
    try {
      if (!purchaseService.isAvailable()) {
        // Em dev/Expo Go, confiar no hash
        return isPremium;
      }

      const validation = await purchaseService.validatePurchase();

      if (validation.isValid && validation.purchaseData) {
        // Atualizar dados se necessário
        if (!isPremium) {
          await setPremium(true, validation.purchaseData);
        }
        return true;
      }

      // Compra inválida - pode ser reembolso
      if (isPremium) {
        console.warn("[Premium] Compra invalidada, removendo acesso");
        await setPremium(false);
      }

      return false;
    } catch (error) {
      console.error("[Premium] Erro na validação:", error);
      return isPremium; // Manter estado atual em caso de erro de rede
    }
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        isLoading,
        purchaseData,
        setPremium,
        restorePurchase,
        validatePurchase,
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
}

export function usePremium() {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error("usePremium deve ser usado dentro de um PremiumProvider");
  }
  return context;
}
