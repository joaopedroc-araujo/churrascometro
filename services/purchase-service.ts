import { Platform } from "react-native";

// IDs dos produtos
export const PRODUCT_IDS = {
  PREMIUM_LIFETIME: Platform.select({
    android: "churrascometro_premium_lifetime",
    ios: "churrascometro_premium_lifetime",
    default: "churrascometro_premium_lifetime",
  }) as string,
};

// Preço do premium
export const PREMIUM_PRICE = "R$ 9,99";

// Verificar se IAP está disponível
let IAPModule: typeof import("expo-in-app-purchases") | null = null;
let isIAPAvailable = false;

try {
  IAPModule = require("expo-in-app-purchases");
  isIAPAvailable = true;
} catch {
  isIAPAvailable = false;
}

// Tipos
export interface PurchaseData {
  productId: string;
  purchaseToken: string;
  transactionId: string;
  purchaseTime: number;
  acknowledged: boolean;
}

export interface PurchaseResult {
  success: boolean;
  purchaseData?: PurchaseData;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  purchaseData?: PurchaseData;
}

class PurchaseService {
  private isConnected = false;
  private purchaseListenerSet = false;
  private pendingPurchaseResolve: ((result: PurchaseResult) => void) | null =
    null;

  // Conectar ao serviço de compras
  async connect(): Promise<boolean> {
    if (!isIAPAvailable || !IAPModule) {
      console.log("[IAP] Módulo não disponível");
      return false;
    }

    if (this.isConnected) {
      return true;
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
      this.purchaseListenerSet = false;
    } catch (error) {
      console.error("[IAP] Erro ao desconectar:", error);
    }
  }

  // Configurar listener de compras
  private setupPurchaseListener(): void {
    if (!IAPModule || this.purchaseListenerSet) return;

    IAPModule.setPurchaseListener(({ responseCode, results, errorCode }) => {
      console.log("[IAP] Purchase listener:", {
        responseCode,
        errorCode,
        results,
      });

      if (this.pendingPurchaseResolve) {
        if (
          responseCode === IAPModule!.IAPResponseCode.OK &&
          results &&
          results.length > 0
        ) {
          const purchase = results.find(
            (p) => p.productId === PRODUCT_IDS.PREMIUM_LIFETIME
          );

          if (purchase) {
            // Finalizar transação (acknowledge)
            if (!purchase.acknowledged) {
              IAPModule!
                .finishTransactionAsync(purchase, true)
                .catch((err) => console.error("[IAP] Erro ao finalizar:", err));
            }

            const purchaseData: PurchaseData = {
              productId: purchase.productId,
              purchaseToken: purchase.purchaseToken || "",
              transactionId: purchase.orderId || "",
              purchaseTime: purchase.purchaseTime || Date.now(),
              acknowledged: true,
            };

            this.pendingPurchaseResolve({ success: true, purchaseData });
          } else {
            this.pendingPurchaseResolve({
              success: false,
              error: "Produto não encontrado",
            });
          }
        } else if (responseCode === IAPModule!.IAPResponseCode.USER_CANCELED) {
          this.pendingPurchaseResolve({
            success: false,
            error: "Compra cancelada",
          });
        } else {
          this.pendingPurchaseResolve({
            success: false,
            error: `Erro na compra (código: ${errorCode || responseCode})`,
          });
        }

        this.pendingPurchaseResolve = null;
      }
    });

    this.purchaseListenerSet = true;
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
      // Em desenvolvimento, simular compra com dados fake
      if (__DEV__) {
        console.log("[IAP] Simulando compra em dev");
        return {
          success: true,
          purchaseData: {
            productId: PRODUCT_IDS.PREMIUM_LIFETIME,
            purchaseToken: `dev_token_${Date.now()}`,
            transactionId: `dev_transaction_${Date.now()}`,
            purchaseTime: Date.now(),
            acknowledged: true,
          },
        };
      }
      return { success: false, error: "Compras não disponíveis" };
    }

    try {
      if (!this.isConnected) {
        await this.connect();
      }

      this.setupPurchaseListener();

      // Criar promise para aguardar resultado do listener
      const purchasePromise = new Promise<PurchaseResult>((resolve) => {
        this.pendingPurchaseResolve = resolve;

        // Timeout de 2 minutos
        setTimeout(() => {
          if (this.pendingPurchaseResolve) {
            this.pendingPurchaseResolve = null;
            resolve({ success: false, error: "Tempo esgotado" });
          }
        }, 120000);
      });

      // Iniciar compra
      await IAPModule.purchaseItemAsync(PRODUCT_IDS.PREMIUM_LIFETIME);

      return purchasePromise;
    } catch (error: any) {
      console.error("[IAP] Erro na compra:", error);
      this.pendingPurchaseResolve = null;
      return {
        success: false,
        error: error.message || "Erro ao processar compra",
      };
    }
  }

  // Validar compra na Play Store (verifica se a compra ainda é válida)
  async validatePurchase(): Promise<ValidationResult> {
    if (!isIAPAvailable || !IAPModule) {
      console.log("[IAP] Validação não disponível - módulo não carregado");
      return { isValid: false };
    }

    try {
      if (!this.isConnected) {
        const connected = await this.connect();
        if (!connected) {
          console.log("[IAP] Não foi possível conectar para validar");
          return { isValid: false };
        }
      }

      // Buscar histórico de compras direto da Play Store
      const { results } = await IAPModule.getPurchaseHistoryAsync();

      if (!results || results.length === 0) {
        console.log("[IAP] Nenhuma compra encontrada no histórico");
        return { isValid: false };
      }

      // Procurar compra do premium
      const premiumPurchase = results.find(
        (p) => p.productId === PRODUCT_IDS.PREMIUM_LIFETIME
      );

      if (!premiumPurchase) {
        console.log("[IAP] Compra premium não encontrada");
        return { isValid: false };
      }

      console.log("[IAP] Compra premium validada:", premiumPurchase.productId);

      return {
        isValid: true,
        purchaseData: {
          productId: premiumPurchase.productId,
          purchaseToken: premiumPurchase.purchaseToken || "",
          transactionId: premiumPurchase.orderId || "",
          purchaseTime: premiumPurchase.purchaseTime || 0,
          acknowledged: premiumPurchase.acknowledged || false,
        },
      };
    } catch (error) {
      console.error("[IAP] Erro ao validar compra:", error);
      return { isValid: false };
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

      if (!results || results.length === 0) {
        return { success: false, error: "Nenhuma compra encontrada" };
      }

      const premiumPurchase = results.find(
        (purchase) => purchase.productId === PRODUCT_IDS.PREMIUM_LIFETIME
      );

      if (premiumPurchase) {
        const purchaseData: PurchaseData = {
          productId: premiumPurchase.productId,
          purchaseToken: premiumPurchase.purchaseToken || "",
          transactionId: premiumPurchase.orderId || "",
          purchaseTime: premiumPurchase.purchaseTime || 0,
          acknowledged: premiumPurchase.acknowledged || false,
        };

        return { success: true, purchaseData };
      }

      return { success: false, error: "Compra premium não encontrada" };
    } catch (error: any) {
      console.error("[IAP] Erro ao restaurar:", error);
      return {
        success: false,
        error: error.message || "Erro ao restaurar compras",
      };
    }
  }

  // Verificar se IAP está disponível
  isAvailable(): boolean {
    return isIAPAvailable;
  }
}

export const purchaseService = new PurchaseService();
