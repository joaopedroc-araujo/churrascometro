import { BottomAdBanner, useInterstitialAd } from "@/components/ads";
import { borderRadius, colors, spacing } from "@/constants/theme";
import {
  clearChecklist,
  getChecklist,
  getLastCalculation,
  saveChecklist,
} from "@/services/storage-service";
import { alerts, haptics } from "@/utils";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ChecklistItem {
  key: string;
  label: string;
  quantity: string;
  price: number;
  section: string;
  checked: boolean;
}

export default function ChecklistScreen() {
  const { showAd } = useInterstitialAd();

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [calculation, savedChecklist] = await Promise.all([
        getLastCalculation(),
        getChecklist(),
      ]);

      if (calculation) {
        setItems(
          calculation.items.map((item) => ({
            ...item,
            checked: savedChecklist[item.key] || false,
          }))
        );
        setCheckedItems(savedChecklist);
        setTotalCost(calculation.totalCost);
      }
    } catch (error) {
      console.error("Erro ao carregar checklist:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  const toggleItem = useCallback(
    async (key: string) => {
      haptics.light();

      const newChecked = { ...checkedItems, [key]: !checkedItems[key] };
      setCheckedItems(newChecked);

      setItems((prev) =>
        prev.map((item) => (item.key === key ? { ...item, checked: !item.checked } : item))
      );

      await saveChecklist(newChecked);
    },
    [checkedItems]
  );

  const clearAll = useCallback(() => {
    alerts.confirmClear("Desmarcar todos os itens?", async () => {
      haptics.success();
      setCheckedItems({});
      setItems((prev) => prev.map((item) => ({ ...item, checked: false })));
      await clearChecklist();
    });
  }, []);

  const handleShare = useCallback(async () => {
    haptics.medium();

    const uncheckedItems = items.filter((item) => !item.checked);
    const checkedCount = items.filter((item) => item.checked).length;

    let message = "🛒 *LISTA DE COMPRAS - CHURRASCO*\n\n";
    message += `✅ ${checkedCount}/${items.length} itens comprados\n\n`;

    if (uncheckedItems.length > 0) {
      message += "*Faltando comprar:*\n";
      uncheckedItems.forEach((item) => {
        message += `⬜ ${item.label}: ${item.quantity}\n`;
      });
    } else {
      message += "🎉 Tudo comprado! Bora churrasquear!\n";
    }

    message += "\n📲 Churrascômetro";

    await Share.share({ message, title: "Lista de Compras" });

    // Mostrar anúncio intersticial após compartilhar
    showAd();
  }, [items, showAd]);

  const checkedCount = items.filter((item) => item.checked).length;
  const progress = items.length > 0 ? (checkedCount / items.length) * 100 : 0;
  const remainingCost = items
    .filter((item) => !item.checked)
    .reduce((sum, item) => sum + item.price, 0);

  // Agrupa itens por seção
  const groupedItems = items.reduce(
    (acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = [];
      }
      acc[item.section].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItem[]>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <FontAwesome name="shopping-cart" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nenhuma lista ainda</Text>
          <Text style={styles.emptyText}>
            Faça um cálculo na aba Calculadora{"\n"}para gerar sua lista de compras
          </Text>
        </View>
        <BottomAdBanner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header com progresso */}
        <View style={styles.header}>
          <Text style={styles.title}>🛒 Lista de Compras</Text>

          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {checkedCount}/{items.length} itens ({progress.toFixed(0)}%)
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Falta gastar</Text>
              <Text style={styles.statValue}>R$ {remainingCost.toFixed(2).replace(".", ",")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total</Text>
              <Text style={styles.statValueSmall}>R$ {totalCost.toFixed(2).replace(".", ",")}</Text>
            </View>
          </View>
        </View>

        {/* Lista agrupada por seção */}
        {Object.entries(groupedItems).map(([section, sectionItems]) => (
          <View key={section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section}</Text>
            <View style={styles.card}>
              {sectionItems.map((item, index) => (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.checklistItem,
                    index < sectionItems.length - 1 && styles.checklistItemBorder,
                  ]}
                  onPress={() => toggleItem(item.key)}
                  activeOpacity={0.7}
                >
                  <FontAwesome
                    name={item.checked ? "check-square" : "square-o"}
                    size={24}
                    color={item.checked ? colors.success : colors.textSecondary}
                  />
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemLabel, item.checked && styles.itemLabelChecked]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.itemQuantity, item.checked && styles.itemQuantityChecked]}>
                      {item.quantity}
                    </Text>
                  </View>
                  <Text style={[styles.itemPrice, item.checked && styles.itemPriceChecked]}>
                    R$ {item.price.toFixed(2).replace(".", ",")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Botões de ação */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
            <FontAwesome name="whatsapp" size={20} color="#fff" />
            <Text style={styles.shareButtonText}>Compartilhar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.clearButton} onPress={clearAll} activeOpacity={0.8}>
            <FontAwesome name="refresh" size={16} color={colors.textSecondary} />
            <Text style={styles.clearButtonText}>Limpar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.adSpace} />
      </ScrollView>

      <BottomAdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.md,
  },
  progressContainer: {
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.round,
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: borderRadius.round,
  },
  progressText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
  },
  statValueSmall: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.secondary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  checklistItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
  },
  checklistItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  itemLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  itemLabelChecked: {
    textDecorationLine: "line-through",
    color: colors.textSecondary,
  },
  itemQuantity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  itemQuantityChecked: {
    textDecorationLine: "line-through",
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
  },
  itemPriceChecked: {
    textDecorationLine: "line-through",
    color: colors.textSecondary,
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  shareButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  shareButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.xs,
  },
  clearButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
  adSpace: {
    height: 60,
  },
});
