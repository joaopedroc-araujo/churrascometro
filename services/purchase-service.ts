import { Platform } from "react-native";

// IDs dos produtos (você vai criar esses na Google Play Console e App Store Connect)
export const PRODUCT_IDS = {
  PREMIUM_LIFETIME: Platform.select({
    android: "churrascometro_premium_lifetime",
    ios: "churrascometro_premium_lifetime",
    default: "churrascometro_premium_lifetime",
  }),
};

// Preço do premium
export const PREMIUM_PRICE = "R$ 9,99";

// Verificar se IAP está disponível
let IAPModule: any = null;
let isIAPAvailable = false;

try {
  IAPModule = require("expo-in-app-purchases");
  isIAPAvailable = true;
} catch {
  isIAPAvailable = false;
}

interface PurchaseResult {
  success: boolean;
  error?: string;
}

class PurchaseService {
  private isConnected = false;

  // Conectar ao serviço de compras
  async connect(): Promise<boolean> {
    if (!isIAPAvailable || !IAPModule) {
      console.log("[IAP] Módulo não disponível");
      return false;
    }

    try {
      await IAPModule.connectAsync();
      this.isConnected = true;
      console.log("[IAP] Conectado com sucesso");
      return true;
    } catch (error) {
      console.error("[IAP] Erro ao conectar:", error);
      return false;
    }
  }

  // Desconectar
  async disconnect(): Promise<void> {
    if (!isIAPAvailable || !IAPModule || !this.isConnected) return;

    try {
      await IAPModule.disconnectAsync();
      this.isConnected = false;
    } catch (error) {
      console.error("[IAP] Erro ao desconectar:", error);
    }
  }

  // Obter produtos disponíveis
  async getProducts(): Promise<any[]> {
    if (!isIAPAvailable || !IAPModule) return [];

    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const { results } = await IAPModule.getProductsAsync([
        PRODUCT_IDS.PREMIUM_LIFETIME,
      ]);
      return results || [];
    } catch (error) {
      console.error("[IAP] Erro ao obter produtos:", error);
      return [];
    }
  }

  // Realizar compra
  async purchasePremium(): Promise<PurchaseResult> {
    if (!isIAPAvailable || !IAPModule) {
      // Em desenvolvimento, simular compra
      if (__DEV__) {
        console.log("[IAP] Simulando compra em dev");
        return { success: true };
      }
      return { success: false, error: "Compras não disponíveis" };
    }

    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Configurar listener de compras
      IAPModule.setPurchaseListener(
        ({ responseCode, results, errorCode }: any) => {
          if (responseCode === IAPModule.IAPResponseCode.OK) {
            results?.forEach(async (purchase: any) => {
              if (!purchase.acknowledged) {
                // Finalizar transação
                await IAPModule.finishTransactionAsync(purchase, true);
              }
            });
          }
        }
      );

      // Iniciar compra
      await IAPModule.purchaseItemAsync(PRODUCT_IDS.PREMIUM_LIFETIME);

      return { success: true };
    } catch (error: any) {
      console.error("[IAP] Erro na compra:", error);
      return {
        success: false,
        error: error.message || "Erro ao processar compra",
      };
    }
  }

  // Restaurar compras anteriores
  async restorePurchases(): Promise<PurchaseResult> {
    if (!isIAPAvailable || !IAPModule) {
      return { success: false, error: "Restauração não disponível" };
    }

    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const { results } = await IAPModule.getPurchaseHistoryAsync();

      const hasPremium = results?.some(
        (purchase: any) => purchase.productId === PRODUCT_IDS.PREMIUM_LIFETIME
      );

      return { success: hasPremium };
    } catch (error: any) {
      console.error("[IAP] Erro ao restaurar:", error);
      return {
        success: false,
        error: error.message || "Erro ao restaurar compras",
      };
    }
  }
}

export const purchaseService = new PurchaseService();
