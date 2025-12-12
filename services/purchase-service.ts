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

// Verificar se react-native-iap está disponível
let RNIap: typeof import("react-native-iap") | null = null;
let isIAPAvailable = false;

try {
  RNIap = require("react-native-iap");
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
  private purchaseUpdateSubscription: any = null;
  private purchaseErrorSubscription: any = null;
  private pendingPurchaseResolve: ((result: PurchaseResult) => void) | null = null;

  // Conectar ao serviço de compras
  async connect(): Promise<boolean> {
    if (!isIAPAvailable || !RNIap) {
      console.log("[IAP] Módulo não disponível");
      return false;
    }

    if (this.isConnected) {
      return true;
    }

    try {
      await RNIap.initConnection();
      this.isConnected = true;
      this.setupListeners();
      console.log("[IAP] Conectado com sucesso");
      return true;
    } catch (error) {
      console.error("[IAP] Erro ao conectar:", error);
      return false;
    }
  }

  // Configurar listeners de compras
  private setupListeners(): void {
    if (!RNIap || this.purchaseUpdateSubscription) {
      return;
    }

    this.purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase) => {
      console.log("[IAP] Compra atualizada:", purchase);

      try {
        // Finalizar transação (acknowledge)
        if (Platform.OS === "android" && purchase.purchaseToken) {
          await RNIap!.acknowledgePurchaseAndroid(purchase.purchaseToken);
        } else {
          await RNIap!.finishTransaction({ purchase });
        }

        const purchaseData: PurchaseData = {
          productId: purchase.productId,
          purchaseToken: purchase.purchaseToken || "",
          transactionId: purchase.transactionId || "",
          purchaseTime: new Date(purchase.transactionDate || Date.now()).getTime(),
          acknowledged: true,
        };

        if (this.pendingPurchaseResolve) {
          this.pendingPurchaseResolve({ success: true, purchaseData });
          this.pendingPurchaseResolve = null;
        }
      } catch (error) {
        console.error("[IAP] Erro ao finalizar transação:", error);
      }
    });

    this.purchaseErrorSubscription = RNIap.purchaseErrorListener((error) => {
      console.error("[IAP] Erro na compra:", error);

      if (this.pendingPurchaseResolve) {
        const isCancelled = String(error.code) === "E_USER_CANCELLED";
        this.pendingPurchaseResolve({
          success: false,
          error: isCancelled ? "Compra cancelada" : error.message,
        });
        this.pendingPurchaseResolve = null;
      }
    });
  }

  // Desconectar
  async disconnect(): Promise<void> {
    if (!isIAPAvailable || !RNIap || !this.isConnected) {
      return;
    }

    try {
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }
      await RNIap.endConnection();
      this.isConnected = false;
    } catch (error) {
      console.error("[IAP] Erro ao desconectar:", error);
    }
  }

  // Obter produtos disponíveis
  async getProducts(): Promise<any[]> {
    if (!isIAPAvailable || !RNIap) {
      return [];
    }

    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // Nova API do react-native-iap v13+ usa fetchProducts
      const products = await RNIap.fetchProducts({
        skus: [PRODUCT_IDS.PREMIUM_LIFETIME],
      });
      return products || [];
    } catch (error) {
      console.error("[IAP] Erro ao obter produtos:", error);
      return [];
    }
  }

  // Realizar compra
  async purchasePremium(): Promise<PurchaseResult> {
    if (!isIAPAvailable || !RNIap) {
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

      // Iniciar compra - Nova API react-native-iap v13+
      await RNIap.requestPurchase({
        request: {
          google: { skus: [PRODUCT_IDS.PREMIUM_LIFETIME] },
          apple: { sku: PRODUCT_IDS.PREMIUM_LIFETIME },
        },
        type: "in-app",
      });

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
    if (!isIAPAvailable || !RNIap) {
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

      // Buscar compras disponíveis (não consumidas)
      const purchases = await RNIap.getAvailablePurchases();

      if (!purchases || purchases.length === 0) {
        console.log("[IAP] Nenhuma compra encontrada");
        return { isValid: false };
      }

      // Procurar compra do premium
      const premiumPurchase = purchases.find((p) => p.productId === PRODUCT_IDS.PREMIUM_LIFETIME);

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
          transactionId: premiumPurchase.transactionId || "",
          purchaseTime: new Date(premiumPurchase.transactionDate || 0).getTime(),
          acknowledged: true,
        },
      };
    } catch (error) {
      console.error("[IAP] Erro ao validar compra:", error);
      return { isValid: false };
    }
  }

  // Restaurar compras anteriores
  async restorePurchases(): Promise<PurchaseResult> {
    if (!isIAPAvailable || !RNIap) {
      return { success: false, error: "Restauração não disponível" };
    }

    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const purchases = await RNIap.getAvailablePurchases();

      if (!purchases || purchases.length === 0) {
        return { success: false, error: "Nenhuma compra encontrada" };
      }

      const premiumPurchase = purchases.find(
        (purchase) => purchase.productId === PRODUCT_IDS.PREMIUM_LIFETIME
      );

      if (premiumPurchase) {
        const purchaseData: PurchaseData = {
          productId: premiumPurchase.productId,
          purchaseToken: premiumPurchase.purchaseToken || "",
          transactionId: premiumPurchase.transactionId || "",
          purchaseTime: new Date(premiumPurchase.transactionDate || 0).getTime(),
          acknowledged: true,
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
