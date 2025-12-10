import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

const PREMIUM_KEY = "@churrascometro:isPremium";

interface PremiumContextType {
  isPremium: boolean;
  isLoading: boolean;
  setPremium: (value: boolean) => Promise<void>;
  restorePurchase: () => Promise<boolean>;
}

const PremiumContext = createContext<PremiumContextType | undefined>(undefined);

interface PremiumProviderProps {
  children: ReactNode;
}

export function PremiumProvider({ children }: PremiumProviderProps) {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar estado premium ao iniciar
  useEffect(() => {
    loadPremiumStatus();
  }, []);

  const loadPremiumStatus = async () => {
    try {
      const stored = await AsyncStorage.getItem(PREMIUM_KEY);
      if (stored === "true") {
        setIsPremium(true);
      }
    } catch (error) {
      console.error("Erro ao carregar status premium:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setPremium = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(PREMIUM_KEY, value ? "true" : "false");
      setIsPremium(value);
    } catch (error) {
      console.error("Erro ao salvar status premium:", error);
    }
  };

  // Restaurar compra (para quando o usuário reinstalar o app)
  const restorePurchase = async (): Promise<boolean> => {
    // TODO: Implementar verificação com a store real
    // Por enquanto, apenas verifica o AsyncStorage
    try {
      const stored = await AsyncStorage.getItem(PREMIUM_KEY);
      if (stored === "true") {
        setIsPremium(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  return (
    <PremiumContext.Provider value={{ isPremium, isLoading, setPremium, restorePurchase }}>
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
