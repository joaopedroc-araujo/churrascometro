import { BottomAdBanner, useInterstitialAd } from "@/components/ads";
import { borderRadius, colors, spacing } from "@/constants/theme";
import {
  CustomItem,
  CustomPrices,
  deleteCustomItem,
  getCustomItems,
  getCustomPrices,
  resetPrices,
  saveCustomItem,
  saveCustomPrices,
} from "@/services/storage-service";
import {
  alerts,
  haptics,
  isValidItemName,
  isValidPrice,
  sanitizePrice,
  sanitizeString,
} from "@/utils";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { useCallback, useEffect, useState } from "react";
import {
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
import { SafeAreaView } from "react-native-safe-area-context";

// Definição dos itens com preços padrão
interface PriceItem {
  key: string;
  label: string;
  defaultPrice: number;
  unit: string;
  category: string;
}

const PRICE_ITEMS: PriceItem[] = [
  // Carnes
  { key: "picanha", label: "Picanha", defaultPrice: 89.9, unit: "kg", category: "🥩 Carnes" },
  { key: "costela", label: "Costela", defaultPrice: 34.9, unit: "kg", category: "🥩 Carnes" },
  { key: "linguica", label: "Linguiça", defaultPrice: 24.9, unit: "kg", category: "🥩 Carnes" },
  { key: "frango", label: "Coração/Frango", defaultPrice: 29.9, unit: "kg", category: "🥩 Carnes" },
  { key: "maminha", label: "Maminha", defaultPrice: 54.9, unit: "kg", category: "🥩 Carnes" },
  { key: "fraldinha", label: "Fraldinha", defaultPrice: 49.9, unit: "kg", category: "🥩 Carnes" },
  // Vegetariano
  {
    key: "queijo_coalho",
    label: "Queijo Coalho",
    defaultPrice: 45.9,
    unit: "kg",
    category: "🧀 Vegetariano",
  },
  { key: "abacaxi", label: "Abacaxi", defaultPrice: 6.0, unit: "un", category: "🧀 Vegetariano" },
  {
    key: "cogumelos",
    label: "Cogumelos",
    defaultPrice: 39.9,
    unit: "kg",
    category: "🧀 Vegetariano",
  },
  {
    key: "legumes",
    label: "Legumes Grelhados",
    defaultPrice: 12.9,
    unit: "kg",
    category: "🧀 Vegetariano",
  },
  // Acompanhamentos
  { key: "arroz", label: "Arroz", defaultPrice: 6.9, unit: "kg", category: "🍚 Acompanhamentos" },
  { key: "farofa", label: "Farofa", defaultPrice: 8.9, unit: "kg", category: "🍚 Acompanhamentos" },
  {
    key: "vinagrete",
    label: "Vinagrete",
    defaultPrice: 15.0,
    unit: "kg",
    category: "🍚 Acompanhamentos",
  },
  {
    key: "pao_alho",
    label: "Pão de Alho",
    defaultPrice: 2.5,
    unit: "un",
    category: "🍚 Acompanhamentos",
  },
  // Bebidas
  {
    key: "cerveja",
    label: "Cerveja (lata)",
    defaultPrice: 3.5,
    unit: "un",
    category: "🍺 Bebidas",
  },
  {
    key: "refrigerante",
    label: "Refrigerante",
    defaultPrice: 8.0,
    unit: "L",
    category: "🍺 Bebidas",
  },
  { key: "agua", label: "Água", defaultPrice: 3.0, unit: "L", category: "🍺 Bebidas" },
  { key: "suco", label: "Suco", defaultPrice: 12.0, unit: "L", category: "🍺 Bebidas" },
  // Extras
  { key: "carvao", label: "Carvão", defaultPrice: 25.0, unit: "kg", category: "🔥 Extras" },
  { key: "sal_grosso", label: "Sal Grosso", defaultPrice: 4.0, unit: "kg", category: "🔥 Extras" },
  { key: "gelo", label: "Gelo", defaultPrice: 8.0, unit: "kg", category: "🔥 Extras" },
];

const CATEGORIES = [
  "🥩 Carnes",
  "🧀 Vegetariano",
  "🍚 Acompanhamentos",
  "🍺 Bebidas",
  "🔥 Extras",
  "📦 Meus Itens",
];

const UNITS = ["kg", "un", "L", "pacote", "caixa"];

export default function SettingsScreen() {
  const { showAd } = useInterstitialAd();

  const [prices, setPrices] = useState<CustomPrices>({});
  const [editedPrices, setEditedPrices] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customItems, setCustomItems] = useState<CustomItem[]>([]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("un");
  const [newItemCategory, setNewItemCategory] = useState("📦 Meus Itens");

  useEffect(() => {
    loadPrices();
  }, []);

  const loadPrices = async () => {
    try {
      const [customPrices, savedCustomItems] = await Promise.all([
        getCustomPrices(),
        getCustomItems(),
      ]);

      setPrices(customPrices);
      setCustomItems(savedCustomItems);

      // Inicializa os valores de edição
      const initialEdited: Record<string, string> = {};
      PRICE_ITEMS.forEach((item) => {
        const price = customPrices[item.key] ?? item.defaultPrice;
        initialEdited[item.key] = price.toFixed(2).replace(".", ",");
      });

      // Adiciona itens customizados
      savedCustomItems.forEach((item) => {
        initialEdited[item.key] = item.price.toFixed(2).replace(".", ",");
      });

      setEditedPrices(initialEdited);
    } catch (error) {
      console.error("Erro ao carregar preços:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (key: string, value: string) => {
    // Remove caracteres não numéricos exceto vírgula
    const cleaned = value.replace(/[^0-9,]/g, "");
    setEditedPrices((prev) => ({ ...prev, [key]: cleaned }));
    setHasChanges(true);
  };

  const parsePrice = (value: string): number => {
    return parseFloat(value.replace(",", ".")) || 0;
  };

  const handleAddItem = useCallback(async () => {
    // Validação do nome
    const sanitizedName = sanitizeString(newItemName, 50);
    if (!isValidItemName(sanitizedName)) {
      alerts.error("O nome deve ter entre 2 e 50 caracteres", "Nome Inválido");
      return;
    }

    // Validação do preço
    if (!isValidPrice(newItemPrice)) {
      alerts.error("Digite um preço válido maior que zero", "Preço Inválido");
      return;
    }

    const price = sanitizePrice(newItemPrice);
    if (price > 10000) {
      alerts.error("Preço muito alto. Máximo permitido: R$ 10.000", "Preço Inválido");
      return;
    }

    haptics.success();

    const key = `custom_${Date.now()}`;

    const newItem: CustomItem = {
      key,
      label: sanitizedName,
      price,
      unit: newItemUnit,
      category: newItemCategory,
    };

    await saveCustomItem(newItem);

    setCustomItems((prev) => [...prev, newItem]);
    setEditedPrices((prev) => ({
      ...prev,
      [key]: price.toFixed(2).replace(".", ","),
    }));

    // Limpa o formulário
    setNewItemName("");
    setNewItemPrice("");
    setNewItemUnit("un");
    setNewItemCategory("📦 Meus Itens");
    setShowModal(false);

    showAd();
  }, [newItemName, newItemPrice, newItemUnit, newItemCategory, showAd]);

  const handleDeleteItem = useCallback((item: CustomItem) => {
    alerts.confirmDelete(item.label, async () => {
      haptics.warning();
      await deleteCustomItem(item.key);
      setCustomItems((prev) => prev.filter((i) => i.key !== item.key));
      setEditedPrices((prev) => {
        const updated = { ...prev };
        delete updated[item.key];
        return updated;
      });
    });
  }, []);

  const handleSave = useCallback(async () => {
    haptics.success();

    const newPrices: CustomPrices = {};
    Object.entries(editedPrices).forEach(([key, value]) => {
      const numValue = parsePrice(value);
      const item = PRICE_ITEMS.find((i) => i.key === key);
      // Só salva se for diferente do padrão
      if (item && numValue !== item.defaultPrice) {
        newPrices[key] = numValue;
      }
    });

    await saveCustomPrices(newPrices);
    setPrices(newPrices);
    setHasChanges(false);

    // Mostrar anúncio intersticial após salvar
    showAd();

    alerts.success("Sucesso", "Preços salvos com sucesso!");
  }, [editedPrices, showAd]);

  const handleReset = useCallback(() => {
    alerts.confirmReset("Voltar todos os preços para o padrão?", async () => {
      haptics.warning();
      await resetPrices();

      // Reseta para os valores padrão
      const defaultEdited: Record<string, string> = {};
      PRICE_ITEMS.forEach((item) => {
        defaultEdited[item.key] = item.defaultPrice.toFixed(2).replace(".", ",");
      });
      setEditedPrices(defaultEdited);
      setPrices({});
      setHasChanges(false);
    });
  }, []);

  // Agrupa itens por categoria (incluindo customizados)
  const groupedItems = [
    ...PRICE_ITEMS,
    ...customItems.map((ci) => ({
      key: ci.key,
      label: ci.label,
      defaultPrice: ci.price,
      unit: ci.unit,
      category: ci.category,
      isCustom: true,
    })),
  ].reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, (PriceItem & { isCustom?: boolean })[]>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>⚙️ Configurar Preços</Text>
            <Text style={styles.subtitle}>Ajuste os preços conforme sua região</Text>
          </View>

          {/* Lista de preços por categoria */}
          {Object.entries(groupedItems).map(([category, items]) => (
            <View key={category} style={styles.section}>
              <Text style={styles.sectionTitle}>{category}</Text>
              <View style={styles.card}>
                {items.map((item, index) => {
                  const currentPrice = parsePrice(editedPrices[item.key] || "0");
                  const isModified = prices[item.key] !== undefined;
                  const isDifferent = currentPrice !== item.defaultPrice;
                  const isCustomItem = "isCustom" in item && item.isCustom;

                  return (
                    <View
                      key={item.key}
                      style={[styles.priceRow, index < items.length - 1 && styles.priceRowBorder]}
                    >
                      <View style={styles.priceLabel}>
                        <View style={styles.labelRow}>
                          <Text style={styles.itemName}>{item.label}</Text>
                          {isCustomItem && (
                            <TouchableOpacity
                              onPress={() =>
                                handleDeleteItem(customItems.find((ci) => ci.key === item.key)!)
                              }
                              style={styles.deleteButton}
                              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                              <FontAwesome name="trash" size={12} color={colors.primary} />
                            </TouchableOpacity>
                          )}
                        </View>
                        <Text style={styles.itemUnit}>por {item.unit}</Text>
                      </View>
                      <View style={styles.priceInputContainer}>
                        <Text style={styles.currency}>R$</Text>
                        <TextInput
                          style={[styles.priceInput, isDifferent && styles.priceInputModified]}
                          value={editedPrices[item.key]}
                          onChangeText={(value) => handlePriceChange(item.key, value)}
                          keyboardType="decimal-pad"
                          placeholder={item.defaultPrice.toFixed(2).replace(".", ",")}
                          placeholderTextColor={colors.textSecondary}
                        />
                        {isModified && !isCustomItem && (
                          <TouchableOpacity
                            onPress={() => {
                              handlePriceChange(
                                item.key,
                                item.defaultPrice.toFixed(2).replace(".", ",")
                              );
                            }}
                            style={styles.resetButton}
                          >
                            <FontAwesome name="undo" size={12} color={colors.textSecondary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}

          {/* Botão Adicionar Item */}
          <TouchableOpacity
            style={styles.addItemButton}
            onPress={() => setShowModal(true)}
            activeOpacity={0.8}
          >
            <FontAwesome name="plus-circle" size={20} color={colors.secondary} />
            <Text style={styles.addItemButtonText}>Adicionar Novo Item</Text>
          </TouchableOpacity>

          {/* Botões de ação */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.saveButton, !hasChanges && styles.saveButtonDisabled]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={!hasChanges}
            >
              <FontAwesome name="check" size={18} color="#fff" />
              <Text style={styles.saveButtonText}>Salvar Preços</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetAllButton}
              onPress={handleReset}
              activeOpacity={0.8}
            >
              <FontAwesome name="refresh" size={14} color={colors.textSecondary} />
              <Text style={styles.resetAllButtonText}>Restaurar Padrão</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.adSpace} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal para adicionar item */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>➕ Novo Item</Text>

            <Text style={styles.inputLabel}>Nome do Item</Text>
            <TextInput
              style={styles.modalInput}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Ex: Linguiça Toscana"
              placeholderTextColor={colors.textSecondary}
            />

            <Text style={styles.inputLabel}>Preço (R$)</Text>
            <TextInput
              style={styles.modalInput}
              value={newItemPrice}
              onChangeText={(v) => setNewItemPrice(v.replace(/[^0-9,]/g, ""))}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="decimal-pad"
            />

            <Text style={styles.inputLabel}>Unidade</Text>
            <View style={styles.optionsRow}>
              {UNITS.map((unit) => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.optionChip, newItemUnit === unit && styles.optionChipActive]}
                  onPress={() => setNewItemUnit(unit)}
                >
                  <Text
                    style={[
                      styles.optionChipText,
                      newItemUnit === unit && styles.optionChipTextActive,
                    ]}
                  >
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Categoria</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              <View style={styles.optionsRow}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.optionChip, newItemCategory === cat && styles.optionChipActive]}
                    onPress={() => setNewItemCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        newItemCategory === cat && styles.optionChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={handleAddItem}>
                <FontAwesome name="plus" size={14} color="#fff" />
                <Text style={styles.modalSaveText}>Adicionar</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
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
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
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
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
  },
  priceRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  priceLabel: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  itemUnit: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currency: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  priceInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    color: colors.text,
    textAlign: "right",
    minWidth: 80,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceInputModified: {
    borderColor: colors.secondary,
    backgroundColor: `${colors.secondary}10`,
  },
  resetButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  deleteButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderWidth: 2,
    borderColor: colors.secondary,
    borderStyle: "dashed",
  },
  addItemButtonText: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "600",
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  saveButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.5,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resetAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  resetAllButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  adSpace: {
    height: 80,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: "100%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: spacing.lg,
    textAlign: "center",
  },
  inputLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  modalInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  categoryScroll: {
    marginTop: spacing.xs,
    maxHeight: 50,
  },
  optionChip: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.round,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  optionChipText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  optionChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: "500",
  },
  modalSaveButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  modalSaveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
