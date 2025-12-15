import { BottomAdBanner } from "@/components/ads";
import { borderRadius, colors, spacing } from "@/constants/theme";
import {
  deleteStore,
  getLastCalculation,
  getStores,
  saveStore,
  Store,
  StorePrice,
} from "@/services/storage-service";
import { alerts, haptics } from "@/utils";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Stack, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// Preços padrão dos itens
const DEFAULT_PRICES: Record<string, number> = {
  picanha: 89.9,
  costela: 34.9,
  linguica: 24.9,
  frango: 29.9,
  maminha: 54.9,
  fraldinha: 49.9,
  queijo_coalho: 45.9,
  abacaxi: 6.0,
  cogumelos: 39.9,
  legumes: 12.9,
  arroz: 6.9,
  farofa: 8.9,
  vinagrete: 15.0,
  pao_alho: 2.5,
  cerveja: 3.5,
  refrigerante: 8.0,
  agua: 3.0,
  suco: 12.0,
  carvao: 25.0,
  sal_grosso: 4.0,
  gelo: 8.0,
};

export default function PriceComparatorScreen() {
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [calculationItems, setCalculationItems] = useState<
    Array<{ key: string; label: string; quantity: number; unit: string }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [newStoreName, setNewStoreName] = useState("");
  const [editingPrices, setEditingPrices] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedStores, lastCalc] = await Promise.all([getStores(), getLastCalculation()]);

      setStores(savedStores);

      if (lastCalc?.items) {
        // Filtra itens que têm quantidade numérica
        const items = lastCalc.items
          .map((item) => {
            // Extrai número da quantidade (ex: "2,5 kg" -> 2.5)
            const match = item.quantity.match(/[\d,]+/);
            const qty = match ? parseFloat(match[0].replace(",", ".")) : 0;
            return {
              key: item.key,
              label: item.label,
              quantity: qty,
              unit: item.quantity.replace(/[\d,\s]+/, "").trim(),
            };
          })
          .filter((item) => item.quantity > 0);

        setCalculationItems(items);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = useCallback(async () => {
    const name = newStoreName.trim();
    if (!name) {
      alerts.error("Digite um nome para o mercado", "Nome Inválido");
      return;
    }

    if (name.length < 2 || name.length > 30) {
      alerts.error("O nome deve ter entre 2 e 30 caracteres", "Nome Inválido");
      return;
    }

    if (stores.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      alerts.error("Já existe um mercado com esse nome", "Nome Duplicado");
      return;
    }

    haptics.success();

    const newStore: Store = {
      id: `store_${Date.now()}`,
      name,
      prices: {},
      createdAt: new Date().toISOString(),
    };

    await saveStore(newStore);
    setStores((prev) => [...prev, newStore]);
    setNewStoreName("");
    setShowAddModal(false);

    // Abre para editar os preços
    setSelectedStore(newStore);
    const prices: Record<string, string> = {};
    calculationItems.forEach((item) => {
      const price = DEFAULT_PRICES[item.key] ?? 0;
      prices[item.key] = price > 0 ? price.toFixed(2).replace(".", ",") : "";
    });
    setEditingPrices(prices);
    setShowEditModal(true);
  }, [newStoreName, stores, calculationItems]);

  const handleEditStore = useCallback((store: Store) => {
    setSelectedStore(store);
    const prices: Record<string, string> = {};
    calculationItems.forEach((item) => {
      const price = store.prices[item.key] ?? DEFAULT_PRICES[item.key] ?? 0;
      prices[item.key] = price > 0 ? price.toFixed(2).replace(".", ",") : "";
    });
    setEditingPrices(prices);
    setShowEditModal(true);
  }, [calculationItems]);

  const handleSavePrices = useCallback(async () => {
    if (!selectedStore) {
      return;
    }

    haptics.success();

    const prices: StorePrice = {};
    Object.entries(editingPrices).forEach(([key, value]) => {
      if (value) {
        prices[key] = parseFloat(value.replace(",", ".")) || 0;
      }
    });

    const updatedStore: Store = {
      ...selectedStore,
      prices,
    };

    await saveStore(updatedStore);
    setStores((prev) => prev.map((s) => (s.id === updatedStore.id ? updatedStore : s)));
    setShowEditModal(false);
    setSelectedStore(null);
  }, [selectedStore, editingPrices]);

  const handleDeleteStore = useCallback((store: Store) => {
    alerts.confirmDelete(store.name, async () => {
      haptics.warning();
      await deleteStore(store.id);
      setStores((prev) => prev.filter((s) => s.id !== store.id));
    });
  }, []);

  const handlePriceChange = (key: string, value: string) => {
    const cleaned = value.replace(/[^0-9,]/g, "");
    setEditingPrices((prev) => ({ ...prev, [key]: cleaned }));
  };

  // Calcula o total de cada mercado
  const storeComparison = useMemo(() => {
    return stores
      .map((store) => {
        let total = 0;
        let hasAllPrices = true;

        calculationItems.forEach((item) => {
          const price = store.prices[item.key] ?? DEFAULT_PRICES[item.key] ?? 0;
          if (price > 0) {
            total += price * item.quantity;
          } else {
            hasAllPrices = false;
          }
        });

        return {
          store,
          total,
          hasAllPrices,
        };
      })
      .sort((a, b) => a.total - b.total);
  }, [stores, calculationItems]);

  const cheapestTotal = storeComparison.length > 0 ? storeComparison[0].total : 0;

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen
          options={{
            title: "Comparador de Preços",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (calculationItems.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={["bottom"]}>
        <Stack.Screen
          options={{
            title: "Comparador de Preços",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.emptyContainer}>
          <FontAwesome name="shopping-cart" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Sem cálculo ativo</Text>
          <Text style={styles.emptyText}>
            Primeiro, faça um cálculo na calculadora principal para comparar preços entre mercados.
          </Text>
          <TouchableOpacity style={styles.goButton} onPress={() => router.back()}>
            <FontAwesome name="calculator" size={18} color={colors.text} />
            <Text style={styles.goButtonText}>Ir para Calculadora</Text>
          </TouchableOpacity>
        </View>
        <BottomAdBanner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "Comparador de Preços",
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Info */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.infoCard}>
          <FontAwesome name="info-circle" size={20} color={colors.secondary} />
          <Text style={styles.infoText}>
            Compare preços de diferentes mercados para encontrar onde seu churrasco sai mais barato!
          </Text>
        </Animated.View>

        {/* Lista de itens do cálculo atual */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.section}>
          <Text style={styles.sectionTitle}>
            <FontAwesome name="list" size={16} /> Itens do seu Churrasco
          </Text>
          <View style={styles.itemsList}>
            {calculationItems.slice(0, 5).map((item) => (
              <View key={item.key} style={styles.itemChip}>
                <Text style={styles.itemChipText}>
                  {item.label}: {item.quantity.toFixed(1).replace(".", ",")} {item.unit}
                </Text>
              </View>
            ))}
            {calculationItems.length > 5 && (
              <View style={styles.itemChip}>
                <Text style={styles.itemChipText}>+{calculationItems.length - 5} itens</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Comparação de mercados */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              <FontAwesome name="balance-scale" size={16} /> Comparação
            </Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <FontAwesome name="plus" size={14} color={colors.text} />
              <Text style={styles.addButtonText}>Adicionar Mercado</Text>
            </TouchableOpacity>
          </View>

          {stores.length === 0 ? (
            <View style={styles.emptyStores}>
              <FontAwesome name="shopping-basket" size={40} color={colors.textSecondary} />
              <Text style={styles.emptyStoresText}>
                Adicione mercados para comparar preços
              </Text>
            </View>
          ) : (
            <View style={styles.storesList}>
              {storeComparison.map((item, index) => {
                const isCheapest = index === 0 && stores.length > 1;
                const savings = item.total - cheapestTotal;

                return (
                  <Animated.View
                    key={item.store.id}
                    entering={FadeInUp.delay(index * 100).duration(300)}
                  >
                    <TouchableOpacity
                      style={[styles.storeCard, isCheapest && styles.storeCardCheapest]}
                      onPress={() => handleEditStore(item.store)}
                      onLongPress={() => handleDeleteStore(item.store)}
                    >
                      <View style={styles.storeHeader}>
                        <View style={styles.storeNameContainer}>
                          {isCheapest && (
                            <View style={styles.cheapestBadge}>
                              <FontAwesome name="trophy" size={10} color={colors.background} />
                              <Text style={styles.cheapestBadgeText}>Mais Barato</Text>
                            </View>
                          )}
                          <Text style={styles.storeName}>{item.store.name}</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteStoreButton}
                          onPress={() => handleDeleteStore(item.store)}
                        >
                          <FontAwesome name="trash" size={14} color={colors.textSecondary} />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.storeBody}>
                        <Text style={[styles.storeTotal, isCheapest && styles.storeTotalCheapest]}>
                          {formatCurrency(item.total)}
                        </Text>
                        {savings > 0 && (
                          <Text style={styles.storeSavings}>
                            +{formatCurrency(savings)} que o mais barato
                          </Text>
                        )}
                      </View>

                      <View style={styles.storeFooter}>
                        <Text style={styles.storeHint}>
                          <FontAwesome name="pencil" size={10} /> Toque para editar preços
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </Animated.View>

        {/* Dica */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.tipCard}>
          <FontAwesome name="lightbulb-o" size={18} color={colors.warning} />
          <Text style={styles.tipText}>
            Dica: Segure em um mercado para excluí-lo. Você pode cadastrar preços de encartes e
            promoções para comparar onde compensa mais!
          </Text>
        </Animated.View>
      </ScrollView>

      {/* Modal Adicionar Mercado */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Adicionar Mercado</Text>

              <TextInput
                style={styles.modalInput}
                placeholder="Nome do mercado (ex: Mercado X)"
                placeholderTextColor={colors.textSecondary}
                value={newStoreName}
                onChangeText={setNewStoreName}
                maxLength={30}
                autoFocus
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel]}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewStoreName("");
                  }}
                >
                  <Text style={styles.modalButtonCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={handleAddStore}
                >
                  <Text style={styles.modalButtonConfirmText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal Editar Preços */}
      <Modal visible={showEditModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.editModalContainer}
          >
            <View style={styles.editModalContent}>
              <View style={styles.editModalHeader}>
                <Text style={styles.editModalTitle}>
                  {selectedStore?.name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setShowEditModal(false);
                    setSelectedStore(null);
                  }}
                >
                  <FontAwesome name="times" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.editModalSubtitle}>
                Digite os preços deste mercado:
              </Text>

              <FlatList
                data={calculationItems}
                keyExtractor={(item) => item.key}
                style={styles.pricesList}
                renderItem={({ item }) => (
                  <View style={styles.priceRow}>
                    <View style={styles.priceLabel}>
                      <Text style={styles.priceLabelText}>{item.label}</Text>
                      <Text style={styles.priceUnit}>
                        {item.quantity.toFixed(1).replace(".", ",")} {item.unit}
                      </Text>
                    </View>
                    <View style={styles.priceInputContainer}>
                      <Text style={styles.currency}>R$</Text>
                      <TextInput
                        style={styles.priceInput}
                        value={editingPrices[item.key] || ""}
                        onChangeText={(value) => handlePriceChange(item.key, value)}
                        keyboardType="decimal-pad"
                        placeholder={(DEFAULT_PRICES[item.key] || 0).toFixed(2).replace(".", ",")}
                        placeholderTextColor={colors.textSecondary}
                      />
                    </View>
                  </View>
                )}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSavePrices}>
                <FontAwesome name="check" size={18} color={colors.text} />
                <Text style={styles.saveButtonText}>Salvar Preços</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <BottomAdBanner />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.text,
    fontSize: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  goButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  goButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  infoText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  itemsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  itemChip: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  itemChipText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.sm,
  },
  addButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
  },
  emptyStores: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  emptyStoresText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.md,
    textAlign: "center",
  },
  storesList: {
    gap: spacing.md,
  },
  storeCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "transparent",
  },
  storeCardCheapest: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}15`,
  },
  storeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  storeNameContainer: {
    flex: 1,
  },
  cheapestBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.success,
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
    marginBottom: spacing.xs,
  },
  cheapestBadgeText: {
    color: colors.background,
    fontSize: 10,
    fontWeight: "bold",
  },
  storeName: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  deleteStoreButton: {
    padding: spacing.sm,
  },
  storeBody: {
    marginBottom: spacing.sm,
  },
  storeTotal: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "bold",
  },
  storeTotalCheapest: {
    color: colors.success,
  },
  storeSavings: {
    color: colors.primary,
    fontSize: 13,
    marginTop: 2,
  },
  storeFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.background,
    paddingTop: spacing.sm,
  },
  storeHint: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  tipCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: `${colors.warning}15`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: `${colors.warning}30`,
  },
  tipText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: "center",
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
  },
  modalButtonCancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonConfirm: {
    backgroundColor: colors.primary,
  },
  modalButtonConfirmText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
  },
  // Edit Modal
  editModalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  editModalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    maxHeight: "80%",
  },
  editModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  editModalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "bold",
  },
  editModalSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  pricesList: {
    maxHeight: 400,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  },
  priceLabel: {
    flex: 1,
  },
  priceLabelText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  priceUnit: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.sm,
  },
  currency: {
    color: colors.textSecondary,
    fontSize: 14,
    marginRight: 4,
  },
  priceInput: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "600",
    width: 80,
    paddingVertical: spacing.sm,
    textAlign: "right",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  saveButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "bold",
  },
});
