import { BottomAdBanner, useInterstitialAd } from "@/components/ads";
import { borderRadius, colors, spacing } from "@/constants/theme";
import {
  clearChecklist,
  getChecklist,
  getLastCalculation,
  LastCalculation,
  saveChecklist,
  saveLastCalculation,
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

// Mapeamento de itens para corredores do mercado
const MARKET_AISLES: Record<string, string> = {
  // Carnes
  picanha: "🥩 Açougue",
  costela: "🥩 Açougue",
  linguica: "🥩 Açougue",
  frango: "🥩 Açougue",
  maminha: "🥩 Açougue",
  fraldinha: "🥩 Açougue",
  // Vegetarianos
  queijo_coalho: "🧀 Frios/Laticínios",
  abacaxi: "🥬 Hortifruti",
  cogumelos: "🥬 Hortifruti",
  legumes: "🥬 Hortifruti",
  // Acompanhamentos
  arroz: "🛒 Mercearia",
  farofa: "🛒 Mercearia",
  vinagrete: "🥬 Hortifruti",
  pao_alho: "🍞 Padaria",
  // Bebidas
  cerveja: "🍺 Bebidas",
  refrigerante: "🍺 Bebidas",
  agua: "🍺 Bebidas",
  suco: "🍺 Bebidas",
  // Extras
  carvao: "🔥 Carvão/Churrasco",
  sal_grosso: "🛒 Mercearia",
  gelo: "❄️ Gelo",
};

// Ordem dos corredores no mercado
const AISLE_ORDER = [
  "🥬 Hortifruti",
  "🥩 Açougue",
  "🧀 Frios/Laticínios",
  "🍞 Padaria",
  "🛒 Mercearia",
  "🍺 Bebidas",
  "🔥 Carvão/Churrasco",
  "❄️ Gelo",
];

type ViewMode = "recipe" | "market";

export default function ChecklistScreen() {
  const { showAd } = useInterstitialAd();

  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [totalCost, setTotalCost] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("recipe");

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

  const deleteItem = useCallback(
    async (key: string) => {
      haptics.medium();

      // Remove o item da lista
      const updatedItems = items.filter((item) => item.key !== key);
      setItems(updatedItems);

      // Remove do checkedItems
      const newChecked = { ...checkedItems };
      delete newChecked[key];
      setCheckedItems(newChecked);

      // Recalcula o total
      const newTotalCost = updatedItems.reduce((sum, item) => sum + item.price, 0);
      setTotalCost(newTotalCost);

      // Salva no storage
      await saveChecklist(newChecked);

      // Atualiza o LastCalculation com os novos itens
      const updatedCalculation: LastCalculation = {
        items: updatedItems.map(({ checked: _checked, ...rest }) => rest),
        totalCost: newTotalCost,
        date: new Date().toISOString(),
      };
      await saveLastCalculation(updatedCalculation);
    },
    [items, checkedItems]
  );

  const confirmDeleteItem = useCallback(
    (item: ChecklistItem) => {
      alerts.confirm("Remover item?", `Deseja remover "${item.label}" da lista?`, "Remover", () =>
        deleteItem(item.key)
      );
    },
    [deleteItem]
  );

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

  // Agrupa itens por seção (modo receita)
  const groupedBySection = items.reduce(
    (acc, item) => {
      if (!acc[item.section]) {
        acc[item.section] = [];
      }
      acc[item.section].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItem[]>
  );

  // Agrupa itens por corredor do mercado
  const groupedByAisle = items.reduce(
    (acc, item) => {
      const aisle = MARKET_AISLES[item.key] || "🛒 Outros";
      if (!acc[aisle]) {
        acc[aisle] = [];
      }
      acc[aisle].push(item);
      return acc;
    },
    {} as Record<string, ChecklistItem[]>
  );

  // Ordena os corredores na ordem do mercado
  const sortedAisles = Object.entries(groupedByAisle).sort((a, b) => {
    const indexA = AISLE_ORDER.indexOf(a[0]);
    const indexB = AISLE_ORDER.indexOf(b[0]);
    if (indexA === -1 && indexB === -1) {
      return 0;
    }
    if (indexA === -1) {
      return 1;
    }
    if (indexB === -1) {
      return -1;
    }
    return indexA - indexB;
  });

  // Escolhe qual agrupamento usar baseado no modo
  const groupedItems = viewMode === "market" ? Object.fromEntries(sortedAisles) : groupedBySection;

  // const toggleViewMode = useCallback(() => {
  //   haptics.light();
  //   setViewMode((prev) => (prev === "recipe" ? "market" : "recipe"));
  // }, []);

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

          {/* Toggle de visualização */}
          <View style={styles.viewModeContainer}>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === "recipe" && styles.viewModeButtonActive]}
              onPress={() => {
                haptics.light();
                setViewMode("recipe");
              }}
            >
              <FontAwesome
                name="cutlery"
                size={14}
                color={viewMode === "recipe" ? colors.white : colors.textSecondary}
              />
              <Text
                style={[styles.viewModeText, viewMode === "recipe" && styles.viewModeTextActive]}
              >
                Receita
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewModeButton, viewMode === "market" && styles.viewModeButtonActive]}
              onPress={() => {
                haptics.light();
                setViewMode("market");
              }}
            >
              <FontAwesome
                name="shopping-cart"
                size={14}
                color={viewMode === "market" ? colors.white : colors.textSecondary}
              />
              <Text
                style={[styles.viewModeText, viewMode === "market" && styles.viewModeTextActive]}
              >
                Mercado
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Lista agrupada por seção */}
        {Object.entries(groupedItems).map(([section, sectionItems]) => (
          <View key={section} style={styles.section}>
            <Text style={styles.sectionTitle}>{section}</Text>
            <View style={styles.card}>
              {sectionItems.map((item, index) => (
                <View
                  key={item.key}
                  style={[
                    styles.checklistItem,
                    index < sectionItems.length - 1 && styles.checklistItemBorder,
                  ]}
                >
                  <TouchableOpacity
                    style={styles.checkboxArea}
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
                      <Text
                        style={[styles.itemQuantity, item.checked && styles.itemQuantityChecked]}
                      >
                        {item.quantity}
                      </Text>
                    </View>
                    <Text style={[styles.itemPrice, item.checked && styles.itemPriceChecked]}>
                      R$ {item.price.toFixed(2).replace(".", ",")}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => confirmDeleteItem(item)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <FontAwesome name="trash-o" size={18} color={colors.primary} />
                  </TouchableOpacity>
                </View>
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
  checkboxArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    padding: spacing.sm,
    marginLeft: spacing.sm,
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
  viewModeContainer: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginTop: spacing.md,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  viewModeButtonActive: {
    backgroundColor: colors.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textSecondary,
  },
  viewModeTextActive: {
    color: colors.white,
  },
  adSpace: {
    height: 60,
  },
});
