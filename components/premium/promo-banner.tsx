import { borderRadius, colors, spacing } from "@/constants/theme";
import { usePremium } from "@/contexts/premium-context";
import { PREMIUM_PRICE } from "@/services/purchase-service";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface PromoBannerProps {
  // Mostrar após X segundos (0 = imediatamente)
  showAfterSeconds?: number;
  // Esconder automaticamente após X segundos (0 = não esconder)
  hideAfterSeconds?: number;
  // Callback ao fechar
  onClose?: () => void;
}

export function PromoBanner({
  showAfterSeconds = 30,
  hideAfterSeconds = 0,
  onClose
}: PromoBannerProps) {
  const { isPremium } = usePremium();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(showAfterSeconds === 0);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Se já é premium, não mostrar
    if (isPremium) return;

    // Timer para mostrar o banner
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, showAfterSeconds * 1000);

    return () => clearTimeout(showTimer);
  }, [isPremium, showAfterSeconds]);

  useEffect(() => {
    // Timer para esconder o banner automaticamente
    if (hideAfterSeconds > 0 && isVisible) {
      const hideTimer = setTimeout(() => {
        handleClose();
      }, hideAfterSeconds * 1000);

      return () => clearTimeout(hideTimer);
    }
  }, [isVisible, hideAfterSeconds]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onClose?.();
    });
  };

  const handleUpgrade = () => {
    handleClose();
    router.push("/upgrade");
  };

  // Não renderizar se premium ou não visível
  if (isPremium || !isVisible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome name="star" size={24} color={colors.warning} />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>🔥 Remova os Anúncios!</Text>
          <Text style={styles.subtitle}>
            Apenas {PREMIUM_PRICE} • Pagamento único • Para sempre
          </Text>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <FontAwesome name="times" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade} activeOpacity={0.8}>
        <FontAwesome name="star" size={16} color="#FFFFFF" style={styles.buttonIcon} />
        <Text style={styles.upgradeButtonText}>Quero ser Premium!</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Banner compacto para mostrar inline
export function PromoInlineBanner() {
  const { isPremium } = usePremium();
  const router = useRouter();

  if (isPremium) return null;

  return (
    <TouchableOpacity
      style={styles.inlineContainer}
      onPress={() => router.push("/upgrade")}
      activeOpacity={0.8}
    >
      <View style={styles.inlineContent}>
        <FontAwesome name="star" size={18} color={colors.warning} />
        <Text style={styles.inlineText}>
          <Text style={styles.inlineHighlight}>Remova anúncios</Text> por apenas {PREMIUM_PRICE}
        </Text>
        <FontAwesome name="chevron-right" size={14} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning + "40",
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.warning + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
    padding: spacing.xs,
  },
  upgradeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.warning,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  upgradeButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  // Inline banner styles
  inlineContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inlineContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  inlineText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  inlineHighlight: {
    color: colors.warning,
    fontWeight: "600",
  },
});
