import { borderRadius, colors, spacing } from "@/constants/theme";
import { usePremium } from "@/contexts/premium-context";
import { PREMIUM_PRICE } from "@/services/purchase-service";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface UseAutoUpgradeProps {
  // Primeira exibição após X segundos (default: 30)
  initialDelaySeconds?: number;
  // Repetir a cada X segundos (0 = não repetir)
  repeatIntervalSeconds?: number;
}

// Hook para abrir tela de upgrade automaticamente
export function useAutoUpgrade({
  initialDelaySeconds = 20,
  repeatIntervalSeconds = 240, // 4 minutos
}: UseAutoUpgradeProps = {}) {
  const { isPremium, isLoading } = usePremium();
  const router = useRouter();
  const hasShownInitial = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Aguardar carregar o status premium
    if (isLoading) { return; }

    // Se já é premium, não mostrar
    if (isPremium) {
      // Limpar intervalo se virou premium
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Se desativado
    if (initialDelaySeconds <= 0) { return; }

    let timer: ReturnType<typeof setTimeout> | null = null;

    // Primeira exibição após o delay inicial
    if (!hasShownInitial.current) {
      timer = setTimeout(() => {
        hasShownInitial.current = true;
        router.push("/upgrade");

        // Se tem intervalo de repetição, inicia o loop
        if (repeatIntervalSeconds > 0) {
          intervalRef.current = setInterval(() => {
            router.push("/upgrade");
          }, repeatIntervalSeconds * 1000);
        }
      }, initialDelaySeconds * 1000);
    }

    return () => {
      if (timer) { clearTimeout(timer); }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPremium, isLoading, initialDelaySeconds, repeatIntervalSeconds, router]);
}

// Banner compacto para mostrar no topo (inline)
export function PromoBanner() {
  const { isPremium } = usePremium();
  const router = useRouter();

  if (isPremium) { return null; }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => router.push("/upgrade")}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome name="star" size={20} color={colors.warning} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>🔥 Remova os Anúncios!</Text>
          <Text style={styles.subtitle}>
            Apenas {PREMIUM_PRICE} • Para sempre
          </Text>
        </View>
        <FontAwesome name="chevron-right" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

// Alias para compatibilidade
export const PromoInlineBanner = PromoBanner;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning + "30",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.warning + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
