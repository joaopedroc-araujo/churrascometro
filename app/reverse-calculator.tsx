import { BottomAdBanner } from "@/components/ads";
import { borderRadius, colors, spacing } from "@/constants/theme";
import { haptics } from "@/utils";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Custo médio por pessoa (baseado nos preços do app)
const COST_PER_ADULT = 45; // R$ por adulto carnívoro
const COST_PER_VEGETARIAN = 35; // R$ por adulto vegetariano
const COST_PER_CHILD = 25; // R$ por criança
const COST_PER_BEER_DRINKER = 15; // R$ extra para bebedores de cerveja

interface CalculationResult {
  meatAdults: number;
  vegetarianAdults: number;
  children: number;
  beerDrinkers: number;
  totalPeople: number;
  estimatedCost: number;
  breakdown: {
    meat: number;
    drinks: number;
    sides: number;
    extras: number;
  };
}

export default function ReverseCalculatorScreen() {
  const [budget, setBudget] = useState("");
  const [includeVegetarians, setIncludeVegetarians] = useState(false);
  const [includeChildren, setIncludeChildren] = useState(false);
  const [includeBeer, setIncludeBeer] = useState(true);
  const [vegetarianPercent, setVegetarianPercent] = useState(20); // 20% vegetarianos
  const [childrenPercent, setChildrenPercent] = useState(20); // 20% crianças

  const result = useMemo<CalculationResult | null>(() => {
    const budgetValue = parseFloat(budget.replace(",", "."));
    if (isNaN(budgetValue) || budgetValue <= 0) {
      return null;
    }

    // Calcular custo médio por pessoa considerando as opções
    let avgCostPerPerson = COST_PER_ADULT;

    // Ajustar para bebedores de cerveja
    if (includeBeer) {
      avgCostPerPerson += COST_PER_BEER_DRINKER * 0.7; // 70% bebem cerveja
    }

    // Calcular número máximo de pessoas
    let totalPeople = Math.floor(budgetValue / avgCostPerPerson);

    // Distribuir entre tipos
    let meatAdults = totalPeople;
    let vegetarianAdults = 0;
    let children = 0;
    let beerDrinkers = 0;

    if (includeChildren) {
      children = Math.floor(totalPeople * (childrenPercent / 100));
      meatAdults = totalPeople - children;

      // Recalcular com custo de crianças (mais barato)
      const savingsFromChildren = children * (COST_PER_ADULT - COST_PER_CHILD);
      const extraPeople = Math.floor(savingsFromChildren / avgCostPerPerson);
      totalPeople += extraPeople;
      meatAdults += extraPeople;
    }

    if (includeVegetarians && meatAdults > 0) {
      vegetarianAdults = Math.floor(meatAdults * (vegetarianPercent / 100));
      meatAdults -= vegetarianAdults;

      // Recalcular com custo de vegetarianos (um pouco mais barato)
      const savingsFromVeg = vegetarianAdults * (COST_PER_ADULT - COST_PER_VEGETARIAN);
      const extraPeople = Math.floor(savingsFromVeg / avgCostPerPerson);
      if (extraPeople > 0) {
        meatAdults += extraPeople;
        totalPeople += extraPeople;
      }
    }

    if (includeBeer) {
      beerDrinkers = Math.floor((meatAdults + vegetarianAdults) * 0.7);
    }

    // Calcular custo real estimado
    const meatCost = meatAdults * COST_PER_ADULT;
    const vegCost = vegetarianAdults * COST_PER_VEGETARIAN;
    const childCost = children * COST_PER_CHILD;
    const beerCost = beerDrinkers * COST_PER_BEER_DRINKER;
    const estimatedCost = meatCost + vegCost + childCost + beerCost;

    return {
      meatAdults,
      vegetarianAdults,
      children,
      beerDrinkers,
      totalPeople: meatAdults + vegetarianAdults + children,
      estimatedCost,
      breakdown: {
        meat: meatCost + vegCost,
        drinks: beerCost,
        sides: estimatedCost * 0.15, // ~15% em acompanhamentos
        extras: estimatedCost * 0.1, // ~10% em extras
      },
    };
  }, [budget, includeVegetarians, includeChildren, includeBeer, vegetarianPercent, childrenPercent]);

  const handleApplyToCalculator = useCallback(() => {
    if (!result) {
      return;
    }

    haptics.success();
    // Navegar para a calculadora com os valores
    router.push({
      pathname: "/(tabs)",
      params: {
        meatAdults: result.meatAdults.toString(),
        vegetarianAdults: result.vegetarianAdults.toString(),
        children: result.children.toString(),
        beerDrinkers: result.beerDrinkers.toString(),
      },
    });
  }, [result]);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace(".", ",")}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
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
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <FontAwesome name="arrow-left" size={20} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <FontAwesome name="calculator" size={40} color={colors.secondary} />
              <Text style={styles.title}>Calculadora Reversa</Text>
              <Text style={styles.subtitle}>
                Quanto posso gastar? Descubra quantas pessoas cabem!
              </Text>
            </View>
          </View>

          {/* Input de orçamento */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💰 Seu Orçamento</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencyPrefix}>R$</Text>
              <TextInput
                style={styles.budgetInput}
                value={budget}
                onChangeText={setBudget}
                placeholder="0,00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="decimal-pad"
                maxLength={10}
              />
            </View>
          </View>

          {/* Opções */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Opções</Text>
            <View style={styles.optionsCard}>
              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  haptics.light();
                  setIncludeBeer(!includeBeer);
                }}
              >
                <View style={styles.optionInfo}>
                  <FontAwesome
                    name="beer"
                    size={20}
                    color={includeBeer ? colors.warning : colors.textSecondary}
                  />
                  <Text style={styles.optionLabel}>Incluir cerveja</Text>
                </View>
                <FontAwesome
                  name={includeBeer ? "toggle-on" : "toggle-off"}
                  size={28}
                  color={includeBeer ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  haptics.light();
                  setIncludeVegetarians(!includeVegetarians);
                }}
              >
                <View style={styles.optionInfo}>
                  <FontAwesome
                    name="leaf"
                    size={20}
                    color={includeVegetarians ? colors.success : colors.textSecondary}
                  />
                  <Text style={styles.optionLabel}>Incluir vegetarianos (~{vegetarianPercent}%)</Text>
                </View>
                <FontAwesome
                  name={includeVegetarians ? "toggle-on" : "toggle-off"}
                  size={28}
                  color={includeVegetarians ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.optionRow}
                onPress={() => {
                  haptics.light();
                  setIncludeChildren(!includeChildren);
                }}
              >
                <View style={styles.optionInfo}>
                  <FontAwesome
                    name="child"
                    size={20}
                    color={includeChildren ? colors.secondary : colors.textSecondary}
                  />
                  <Text style={styles.optionLabel}>Incluir crianças (~{childrenPercent}%)</Text>
                </View>
                <FontAwesome
                  name={includeChildren ? "toggle-on" : "toggle-off"}
                  size={28}
                  color={includeChildren ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Resultado */}
          {result && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📊 Resultado</Text>
              <View style={styles.resultCard}>
                <View style={styles.resultMainValue}>
                  <Text style={styles.resultNumber}>{result.totalPeople}</Text>
                  <Text style={styles.resultLabel}>pessoas</Text>
                </View>

                <View style={styles.resultBreakdown}>
                  <View style={styles.breakdownItem}>
                    <FontAwesome name="user" size={16} color={colors.primary} />
                    <Text style={styles.breakdownValue}>{result.meatAdults}</Text>
                    <Text style={styles.breakdownLabel}>carnívoros</Text>
                  </View>

                  {result.vegetarianAdults > 0 && (
                    <View style={styles.breakdownItem}>
                      <FontAwesome name="leaf" size={16} color={colors.success} />
                      <Text style={styles.breakdownValue}>{result.vegetarianAdults}</Text>
                      <Text style={styles.breakdownLabel}>vegetarianos</Text>
                    </View>
                  )}

                  {result.children > 0 && (
                    <View style={styles.breakdownItem}>
                      <FontAwesome name="child" size={16} color={colors.secondary} />
                      <Text style={styles.breakdownValue}>{result.children}</Text>
                      <Text style={styles.breakdownLabel}>crianças</Text>
                    </View>
                  )}

                  {result.beerDrinkers > 0 && (
                    <View style={styles.breakdownItem}>
                      <FontAwesome name="beer" size={16} color={colors.warning} />
                      <Text style={styles.breakdownValue}>{result.beerDrinkers}</Text>
                      <Text style={styles.breakdownLabel}>bebem cerveja</Text>
                    </View>
                  )}
                </View>

                <View style={styles.costEstimate}>
                  <Text style={styles.costLabel}>Custo estimado:</Text>
                  <Text style={styles.costValue}>{formatCurrency(result.estimatedCost)}</Text>
                </View>

                <Text style={styles.costPerPerson}>
                  ≈ {formatCurrency(result.estimatedCost / result.totalPeople)} por pessoa
                </Text>
              </View>

              {/* Botão para aplicar na calculadora */}
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyToCalculator}
                activeOpacity={0.8}
              >
                <FontAwesome name="calculator" size={20} color={colors.white} />
                <Text style={styles.applyButtonText}>Calcular detalhes</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Dica */}
          <View style={styles.tipCard}>
            <FontAwesome name="lightbulb-o" size={20} color={colors.secondary} />
            <Text style={styles.tipText}>
              Esses valores são estimativas baseadas nos preços médios configurados no app.
              Os valores reais podem variar conforme sua região e escolha de carnes.
            </Text>
          </View>

          <View style={styles.adSpace} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  header: {
    marginBottom: spacing.lg,
  },
  backButton: {
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerContent: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: colors.text,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginRight: spacing.sm,
  },
  budgetInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "bold",
    color: colors.text,
    padding: 0,
  },
  optionsCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: "hidden",
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  optionLabel: {
    fontSize: 16,
    color: colors.text,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: "center",
  },
  resultMainValue: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  resultNumber: {
    fontSize: 64,
    fontWeight: "bold",
    color: colors.primary,
  },
  resultLabel: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  resultBreakdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    width: "100%",
  },
  breakdownItem: {
    alignItems: "center",
    minWidth: 70,
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 4,
  },
  breakdownLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  costEstimate: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  costLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  costValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.success,
  },
  costPerPerson: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  applyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.white,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: `${colors.secondary}20`,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  adSpace: {
    height: 80,
  },
});
