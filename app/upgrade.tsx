import { borderRadius, colors, spacing } from "@/constants/theme";
import { usePremium } from "@/contexts/premium-context";
import { PREMIUM_PRICE, purchaseService } from "@/services/purchase-service";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function UpgradeScreen() {
  const { setPremium, restorePurchase } = usePremium();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const benefits = [
    { icon: "ban", text: "Sem anúncios para sempre" },
    { icon: "bolt", text: "App mais rápido e leve" },
    { icon: "heart", text: "Apoie o desenvolvedor" },
    { icon: "refresh", text: "Atualizações prioritárias" },
    { icon: "shield", text: "Compra segura e verificada" },
  ];

  const handlePurchase = async () => {
    setIsLoading(true);

    try {
      const result = await purchaseService.purchasePremium();

      if (result.success && result.purchaseData) {
        // Salvar com dados completos da compra para validação segura
        await setPremium(true, result.purchaseData);
        Alert.alert(
          "🎉 Parabéns!",
          "Você agora é Premium! Todos os anúncios foram removidos.",
          [{ text: "Oba!", onPress: () => router.back() }]
        );
      } else if (result.error !== "Compra cancelada") {
        Alert.alert("Erro", result.error || "Não foi possível completar a compra");
      }
    } catch (error) {
      Alert.alert("Erro", "Ocorreu um erro inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);

    try {
      // Usar o método do contexto que já valida e salva de forma segura
      const restored = await restorePurchase();

      if (restored) {
        Alert.alert(
          "✅ Restaurado!",
          "Sua compra foi restaurada e verificada com sucesso.",
          [{ text: "OK", onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          "Não encontrado",
          "Não encontramos nenhuma compra anterior vinculada a esta conta."
        );
      }
    } catch (error) {
      Alert.alert("Erro", "Não foi possível restaurar a compra");
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <FontAwesome name="times" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.crownContainer}>
            <FontAwesome name="star" size={48} color={colors.warning} />
          </View>
          <Text style={styles.title}>Churrascômetro Premium</Text>
          <Text style={styles.subtitle}>
            Remova todos os anúncios com um único pagamento
          </Text>
        </View>

        {/* Price */}
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Pagamento único</Text>
          <Text style={styles.price}>{PREMIUM_PRICE}</Text>
          <Text style={styles.priceDescription}>Para sempre • Sem mensalidades</Text>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsContainer}>
          <Text style={styles.benefitsTitle}>O que você ganha:</Text>
          {benefits.map((benefit, index) => (
            <View key={index} style={styles.benefitItem}>
              <View style={styles.benefitIcon}>
                <FontAwesome name={benefit.icon as any} size={18} color={colors.success} />
              </View>
              <Text style={styles.benefitText}>{benefit.text}</Text>
            </View>
          ))}
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          style={[styles.purchaseButton, (isLoading || isRestoring) && styles.purchaseButtonDisabled]}
          onPress={handlePurchase}
          disabled={isLoading || isRestoring}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <FontAwesome name="lock" size={18} color="#FFFFFF" style={styles.buttonIcon} />
              <Text style={styles.purchaseButtonText}>Comprar por {PREMIUM_PRICE}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={isLoading || isRestoring}
        >
          {isRestoring ? (
            <ActivityIndicator color={colors.textSecondary} size="small" />
          ) : (
            <Text style={styles.restoreButtonText}>Restaurar compra anterior</Text>
          )}
        </TouchableOpacity>

        {/* Security Badge */}
        <View style={styles.securityBadge}>
          <FontAwesome name="shield" size={14} color={colors.success} />
          <Text style={styles.securityText}>Compra verificada pela Play Store</Text>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          O pagamento será processado pela {"\n"}
          Google Play ou App Store
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  crownContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.warning + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  priceContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.warning,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  price: {
    fontSize: 48,
    fontWeight: "bold",
    color: colors.warning,
    marginVertical: spacing.xs,
  },
  priceDescription: {
    fontSize: 14,
    color: colors.success,
    fontWeight: "600",
  },
  benefitsContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.md,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.success + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  benefitText: {
    fontSize: 15,
    color: colors.text,
    flex: 1,
  },
  purchaseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  purchaseButtonDisabled: {
    opacity: 0.7,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  restoreButton: {
    paddingVertical: spacing.md,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  restoreButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
    textDecorationLine: "underline",
  },
  securityBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  securityText: {
    fontSize: 12,
    color: colors.success,
  },
  footer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.md,
    lineHeight: 18,
  },
});
