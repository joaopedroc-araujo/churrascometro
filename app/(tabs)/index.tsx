import { borderRadius, colors, spacing } from "@/constants/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import * as Haptics from "expo-haptics";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ============ TIPOS ============

type QuantityFormat = "g" | "kg" | "unit" | "l" | "can" | "bag";

interface ItemDefinition {
  key: string;
  label: string;
  perAdult: number;
  perChild?: number;
  format: QuantityFormat;
  pricePerUnit?: number; // Preço por kg, unidade ou litro
}

interface CalculatedItem {
  key: string;
  label: string;
  quantity: number;
  format: QuantityFormat;
  price?: number;
}

interface Section {
  title: string;
  icon: string;
  items: CalculatedItem[];
}

interface CalculationResult {
  sections: Section[];
  totals: {
    totalMeat: number;
    totalBeer: number;
    totalSoda: number;
    totalCharcoal: number;
    totalCost: number;
  };
  participants: {
    total: number;
    adults: number;
    children: number;
  };
}

// ============ DEFINIÇÕES DE ITENS ============

const MEAT_ITEMS: ItemDefinition[] = [
  { key: "picanha", label: "Picanha", perAdult: 200, perChild: 100, format: "g", pricePerUnit: 89.90 },
  { key: "costela", label: "Costela", perAdult: 200, perChild: 100, format: "g", pricePerUnit: 34.90 },
  { key: "linguica", label: "Linguiça", perAdult: 100, perChild: 50, format: "g", pricePerUnit: 24.90 },
  { key: "frango", label: "Coração/Frango", perAdult: 100, perChild: 50, format: "g", pricePerUnit: 29.90 },
  { key: "maminha", label: "Maminha", perAdult: 150, perChild: 80, format: "g", pricePerUnit: 54.90 },
  { key: "fraldinha", label: "Fraldinha", perAdult: 150, perChild: 80, format: "g", pricePerUnit: 49.90 },
];

const VEGETARIAN_ITEMS: ItemDefinition[] = [
  { key: "queijo_coalho", label: "Queijo Coalho", perAdult: 150, format: "g", pricePerUnit: 45.90 },
  { key: "abacaxi", label: "Abacaxi", perAdult: 0.25, format: "unit", pricePerUnit: 6.00 },
  { key: "cogumelos", label: "Cogumelos", perAdult: 100, format: "g", pricePerUnit: 39.90 },
  { key: "legumes", label: "Legumes Grelhados", perAdult: 150, format: "g", pricePerUnit: 12.90 },
];

const SIDE_ITEMS: ItemDefinition[] = [
  { key: "arroz", label: "Arroz", perAdult: 80, perChild: 50, format: "g", pricePerUnit: 6.90 },
  { key: "farofa", label: "Farofa", perAdult: 50, perChild: 30, format: "g", pricePerUnit: 8.90 },
  { key: "vinagrete", label: "Vinagrete", perAdult: 50, perChild: 25, format: "g", pricePerUnit: 15.00 },
  { key: "pao_alho", label: "Pão de Alho", perAdult: 2, perChild: 1, format: "unit", pricePerUnit: 2.50 },
];

const DRINK_ITEMS: ItemDefinition[] = [
  { key: "cerveja", label: "Cerveja", perAdult: 4, format: "can", pricePerUnit: 3.50 },
  { key: "refrigerante", label: "Refrigerante", perAdult: 0.5, perChild: 0.3, format: "l", pricePerUnit: 8.00 },
  { key: "agua", label: "Água", perAdult: 0.5, perChild: 0.3, format: "l", pricePerUnit: 3.00 },
  { key: "suco", label: "Suco", perAdult: 0.3, perChild: 0.4, format: "l", pricePerUnit: 12.00 },
];

const EXTRAS: ItemDefinition[] = [
  { key: "carvao", label: "Carvão", perAdult: 1, format: "kg", pricePerUnit: 25.00 },
  { key: "sal_grosso", label: "Sal Grosso", perAdult: 0.1, format: "kg", pricePerUnit: 4.00 },
  { key: "gelo", label: "Gelo", perAdult: 1, format: "kg", pricePerUnit: 8.00 },
];

// ============ DURAÇÕES ============

interface Duration {
  key: "short" | "long";
  label: string;
  description: string;
  multiplier: number;
}

const DURATIONS: Record<"short" | "long", Duration> = {
  short: {
    key: "short",
    label: "Curto",
    description: "Até 4 horas",
    multiplier: 1,
  },
  long: {
    key: "long",
    label: "Longo",
    description: "Mais de 4 horas",
    multiplier: 1.3,
  },
};

// ============ FUNÇÕES UTILITÁRIAS ============

function roundUp(value: number): number {
  return Math.ceil(value);
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

function calculateItemPrice(quantity: number, format: QuantityFormat, pricePerUnit?: number): number {
  if (!pricePerUnit) return 0;

  switch (format) {
    case "g":
      return (quantity / 1000) * pricePerUnit; // Preço é por kg
    case "kg":
      return quantity * pricePerUnit;
    case "unit":
    case "can":
    case "bag":
      return roundUp(quantity) * pricePerUnit;
    case "l":
      return quantity * pricePerUnit;
    default:
      return 0;
  }
}

function formatQuantity(quantity: number, format: QuantityFormat): string {
  switch (format) {
    case "g":
      if (quantity >= 1000) {
        return `${(quantity / 1000).toFixed(1)} kg`;
      }
      return `${roundUp(quantity)} g`;
    case "kg":
      return `${quantity.toFixed(1)} kg`;
    case "unit":
      const units = roundUp(quantity);
      return `${units} ${units === 1 ? "un" : "un"}`;
    case "l":
      return `${quantity.toFixed(1)} L`;
    case "can":
      const cans = roundUp(quantity);
      return `${cans} ${cans === 1 ? "lata" : "latas"}`;
    case "bag":
      const bags = roundUp(quantity);
      return `${bags} ${bags === 1 ? "saco" : "sacos"}`;
    default:
      return `${roundUp(quantity)}`;
  }
}

// ============ COMPONENTE COUNTER ============

interface CounterProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  icon?: string;
}

function Counter({ label, value, onChange, min = 0, max = 100, icon }: CounterProps) {
  const handleDecrement = () => {
    if (value > min) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(value + 1);
    }
  };

  return (
    <View style={styles.counterContainer}>
      <View style={styles.counterLabelRow}>
        {icon && (
          <FontAwesome
            name={icon as any}
            size={18}
            color={colors.secondary}
            style={styles.counterIcon}
          />
        )}
        <Text style={styles.counterLabel}>{label}</Text>
      </View>
      <View style={styles.counterControls}>
        <TouchableOpacity
          style={[styles.counterButton, value <= min && styles.counterButtonDisabled]}
          onPress={handleDecrement}
          disabled={value <= min}
        >
          <FontAwesome name="minus" size={16} color={value <= min ? colors.textSecondary : colors.white} />
        </TouchableOpacity>
        <Text style={styles.counterValue}>{value}</Text>
        <TouchableOpacity
          style={[styles.counterButton, value >= max && styles.counterButtonDisabled]}
          onPress={handleIncrement}
          disabled={value >= max}
        >
          <FontAwesome name="plus" size={16} color={value >= max ? colors.textSecondary : colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============ COMPONENTE DURATION OPTION ============

interface DurationOptionProps {
  duration: Duration;
  isSelected: boolean;
  onSelect: () => void;
}

function DurationOption({ duration, isSelected, onSelect }: DurationOptionProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect();
  };

  return (
    <TouchableOpacity
      style={[styles.durationOption, isSelected && styles.durationOptionSelected]}
      onPress={handlePress}
    >
      <Text style={[styles.durationLabel, isSelected && styles.durationLabelSelected]}>
        {duration.label}
      </Text>
      <Text style={[styles.durationDescription, isSelected && styles.durationDescriptionSelected]}>
        {duration.description}
      </Text>
    </TouchableOpacity>
  );
}

// ============ COMPONENTE SUMMARY GRID ============

interface SummaryGridProps {
  participants: number;
  totalMeat: number;
  totalBeer: number;
  totalSoda: number;
  totalCharcoal: number;
  totalCost: number;
}

function SummaryGrid({ participants, totalMeat, totalBeer, totalSoda, totalCharcoal, totalCost }: SummaryGridProps) {
  return (
    <View style={styles.summaryGrid}>
      <View style={styles.summaryItem}>
        <FontAwesome name="users" size={24} color={colors.secondary} />
        <Text style={styles.summaryValue}>{participants}</Text>
        <Text style={styles.summaryLabel}>Convidados</Text>
      </View>
      <View style={styles.summaryItem}>
        <FontAwesome name="cutlery" size={24} color={colors.primary} />
        <Text style={styles.summaryValue}>{formatQuantity(totalMeat, "g")}</Text>
        <Text style={styles.summaryLabel}>Carnes</Text>
      </View>
      <View style={styles.summaryItem}>
        <FontAwesome name="beer" size={24} color={colors.warning} />
        <Text style={styles.summaryValue}>{roundUp(totalBeer)}</Text>
        <Text style={styles.summaryLabel}>Cervejas</Text>
      </View>
      <View style={styles.summaryItem}>
        <FontAwesome name="glass" size={24} color={colors.success} />
        <Text style={styles.summaryValue}>{totalSoda.toFixed(1)} L</Text>
        <Text style={styles.summaryLabel}>Refrigerante</Text>
      </View>
      <View style={styles.summaryItem}>
        <FontAwesome name="fire" size={24} color={colors.primary} />
        <Text style={styles.summaryValue}>{totalCharcoal.toFixed(1)} kg</Text>
        <Text style={styles.summaryLabel}>Carvão</Text>
      </View>
      <View style={[styles.summaryItem, styles.summaryItemHighlight]}>
        <FontAwesome name="money" size={24} color={colors.success} />
        <Text style={styles.summaryValueHighlight}>{formatCurrency(totalCost)}</Text>
        <Text style={styles.summaryLabel}>Total Estimado</Text>
      </View>
    </View>
  );
}

// ============ COMPONENTE MEAT SELECTOR ============

interface MeatSelectorProps {
  selectedMeats: Record<string, boolean>;
  onToggle: (key: string) => void;
}

function MeatSelector({ selectedMeats, onToggle }: MeatSelectorProps) {
  return (
    <View style={styles.meatSelectorContainer}>
      {MEAT_ITEMS.map((meat) => (
        <TouchableOpacity
          key={meat.key}
          style={[
            styles.meatChip,
            selectedMeats[meat.key] && styles.meatChipSelected,
          ]}
          onPress={() => onToggle(meat.key)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.meatChipText,
              selectedMeats[meat.key] && styles.meatChipTextSelected,
            ]}
          >
            {meat.label}
          </Text>
          <Text style={styles.meatChipPrice}>
            {formatCurrency(meat.pricePerUnit || 0)}/kg
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ============ COMPONENTE TOGGLE OPTION ============

interface ToggleOptionProps {
  label: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  icon?: string;
}

function ToggleOption({ label, description, value, onChange, icon }: ToggleOptionProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(!value);
  };

  return (
    <TouchableOpacity
      style={[styles.toggleOption, value && styles.toggleOptionSelected]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.toggleOptionContent}>
        {icon && (
          <FontAwesome
            name={icon as any}
            size={20}
            color={value ? colors.primary : colors.textSecondary}
            style={styles.toggleIcon}
          />
        )}
        <View style={styles.toggleTextContainer}>
          <Text style={[styles.toggleLabel, value && styles.toggleLabelSelected]}>
            {label}
          </Text>
          <Text style={[styles.toggleDescription, value && styles.toggleDescriptionSelected]}>
            {description}
          </Text>
        </View>
      </View>
      <View style={[styles.toggleSwitch, value && styles.toggleSwitchActive]}>
        <View style={[styles.toggleKnob, value && styles.toggleKnobActive]} />
      </View>
    </TouchableOpacity>
  );
}

// ============ COMPONENTE RESULT CARD ============

interface ResultCardProps {
  section: Section;
}

function ResultCard({ section }: ResultCardProps) {
  const getIconName = (icon: string) => {
    const iconMap: Record<string, any> = {
      meat: "cutlery",
      vegetarian: "leaf",
      sides: "shopping-basket",
      drinks: "glass",
      extras: "plus-circle",
    };
    return iconMap[icon] || "circle";
  };

  return (
    <View style={styles.resultCard}>
      <View style={styles.resultCardHeader}>
        <FontAwesome name={getIconName(section.icon)} size={20} color={colors.secondary} />
        <Text style={styles.resultCardTitle}>{section.title}</Text>
      </View>
      <View style={styles.resultCardItems}>
        {section.items.map((item) => (
          <View key={item.key} style={styles.resultItem}>
            <Text style={styles.resultItemLabel}>{item.label}</Text>
            <Text style={styles.resultItemValue}>
              {formatQuantity(item.quantity, item.format)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ============ COMPONENTE PRINCIPAL ============

export default function ChurrascometroScreen() {
  // Estado de entrada
  const [meatAdults, setMeatAdults] = useState(10);
  const [vegetarianAdults, setVegetarianAdults] = useState(2);
  const [children, setChildren] = useState(3);
  const [beerDrinkers, setBeerDrinkers] = useState(8);
  const [sodaDrinkers, setSodaDrinkers] = useState(6);
  const [duration, setDuration] = useState<"short" | "long">("short");

  // Estado para opções extras
  const [includeSides, setIncludeSides] = useState(true);

  // Estado para seleção de carnes (todas selecionadas por padrão, exceto as novas)
  const [selectedMeats, setSelectedMeats] = useState<Record<string, boolean>>({
    picanha: true,
    costela: true,
    linguica: true,
    frango: true,
    maminha: false,
    fraldinha: false,
  });

  // Função para toggle de carne
  const toggleMeat = (key: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMeats((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Limitar beerDrinkers ao total de adultos
  const totalAdults = meatAdults + vegetarianAdults;

  const totalParticipantsForSoda = totalAdults + children;

  useEffect(() => {
    if (beerDrinkers > totalAdults) {
      setBeerDrinkers(totalAdults);
    }
  }, [totalAdults, beerDrinkers]);

  useEffect(() => {
    if (sodaDrinkers > totalParticipantsForSoda) {
      setSodaDrinkers(totalParticipantsForSoda);
    }
  }, [totalParticipantsForSoda, sodaDrinkers]);

  // Calcular quantidades
  const result = useMemo<CalculationResult>(() => {
    const multiplier = DURATIONS[duration].multiplier;
    const totalParticipants = totalAdults + children;

    // Contar quantas carnes estão selecionadas para distribuir proporcionalmente
    const selectedMeatCount = Object.values(selectedMeats).filter(Boolean).length;
    const meatMultiplier = selectedMeatCount > 0 ? 4 / selectedMeatCount : 1; // Baseado em 4 carnes originais

    // Calcular itens de carne (apenas para adultos carnívoros e carnes selecionadas)
    const meatItems: CalculatedItem[] = MEAT_ITEMS
      .filter((item) => selectedMeats[item.key])
      .map((item) => {
        const quantity = (item.perAdult * meatAdults + (item.perChild || 0) * children) * multiplier * meatMultiplier;
        const price = calculateItemPrice(quantity, item.format, item.pricePerUnit);
        return {
          key: item.key,
          label: item.label,
          quantity,
          format: item.format,
          price,
        };
      });

    // Calcular itens vegetarianos (apenas para vegetarianos)
    const vegetarianItems: CalculatedItem[] = VEGETARIAN_ITEMS.map((item) => {
      const quantity = item.perAdult * vegetarianAdults * multiplier;
      const price = calculateItemPrice(quantity, item.format, item.pricePerUnit);
      return {
        key: item.key,
        label: item.label,
        quantity,
        format: item.format,
        price,
      };
    });

    // Calcular acompanhamentos (para todos) - apenas se habilitado
    const sideItems: CalculatedItem[] = includeSides
      ? SIDE_ITEMS.map((item) => {
        const quantity = (item.perAdult * totalAdults + (item.perChild || 0) * children) * multiplier;
        const price = calculateItemPrice(quantity, item.format, item.pricePerUnit);
        return {
          key: item.key,
          label: item.label,
          quantity,
          format: item.format,
          price,
        };
      })
      : [];

    // Calcular bebidas
    const drinkItems: CalculatedItem[] = DRINK_ITEMS.map((item) => {
      let quantity = 0;
      if (item.key === "cerveja") {
        quantity = item.perAdult * beerDrinkers * multiplier;
      } else if (item.key === "refrigerante") {
        quantity = item.perAdult * sodaDrinkers * multiplier;
      } else {
        quantity = (item.perAdult * totalAdults + (item.perChild || 0) * children) * multiplier;
      }
      const price = calculateItemPrice(quantity, item.format, item.pricePerUnit);
      return {
        key: item.key,
        label: item.label,
        quantity,
        format: item.format,
        price,
      };
    });

    // Calcular extras
    const totalMeatEaters = meatAdults + children * 0.5;
    const extraItems: CalculatedItem[] = EXTRAS.map((item) => {
      let quantity = 0;
      if (item.key === "carvao") {
        quantity = Math.max(2, totalMeatEaters * 0.5) * multiplier;
      } else if (item.key === "sal_grosso") {
        quantity = Math.max(0.5, totalMeatEaters * 0.1) * multiplier;
      } else if (item.key === "gelo") {
        quantity = totalParticipants * 1 * multiplier;
      }
      const price = calculateItemPrice(quantity, item.format, item.pricePerUnit);
      return {
        key: item.key,
        label: item.label,
        quantity,
        format: item.format,
        price,
      };
    });

    // Calcular totais
    const totalMeat = meatItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalBeer = drinkItems.find((i) => i.key === "cerveja")?.quantity || 0;
    const totalSoda = drinkItems.find((i) => i.key === "refrigerante")?.quantity || 0;
    const totalCharcoal = extraItems.find((i) => i.key === "carvao")?.quantity || 0;

    // Calcular custo total
    const allItems = [...meatItems, ...vegetarianItems, ...sideItems, ...drinkItems, ...extraItems];
    const totalCost = allItems.reduce((sum, item) => sum + (item.price || 0), 0);

    const sections: Section[] = [
      { title: "Carnes", icon: "meat", items: meatItems.filter((i) => i.quantity > 0) },
    ];

    if (vegetarianAdults > 0) {
      sections.push({
        title: "Vegetarianos",
        icon: "vegetarian",
        items: vegetarianItems.filter((i) => i.quantity > 0),
      });
    }

    if (includeSides && sideItems.length > 0) {
      sections.push({
        title: "Acompanhamentos",
        icon: "sides",
        items: sideItems.filter((i) => i.quantity > 0),
      });
    }

    sections.push(
      { title: "Bebidas", icon: "drinks", items: drinkItems.filter((i) => i.quantity > 0) },
      { title: "Extras", icon: "extras", items: extraItems.filter((i) => i.quantity > 0) }
    );

    return {
      sections,
      totals: { totalMeat, totalBeer, totalSoda, totalCharcoal, totalCost },
      participants: { total: totalParticipants, adults: totalAdults, children },
    };
  }, [meatAdults, vegetarianAdults, children, beerDrinkers, sodaDrinkers, duration, totalAdults, includeSides, selectedMeats]);

  // Função para gerar texto da lista de compras
  const generateShoppingListText = (): string => {
    let text = "🔥 *LISTA DE CHURRASCO* 🔥\n\n";
    text += `👥 ${result.participants.total} pessoas (${result.participants.adults} adultos, ${result.participants.children} crianças)\n\n`;

    result.sections.forEach((section) => {
      if (section.items.length > 0) {
        text += `*${section.title}:*\n`;
        section.items.forEach((item) => {
          text += `  • ${item.label}: ${formatQuantity(item.quantity, item.format)}`;
          if (item.price && item.price > 0) {
            text += ` (${formatCurrency(item.price)})`;
          }
          text += "\n";
        });
        text += "\n";
      }
    });

    text += `💰 *TOTAL ESTIMADO: ${formatCurrency(result.totals.totalCost)}*\n`;
    text += `📱 Por pessoa: ${formatCurrency(result.totals.totalCost / result.participants.total)}\n\n`;
    text += "📲 Calculado pelo Churrascômetro";

    return text;
  };

  // Função para compartilhar
  const handleShare = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const message = generateShoppingListText();
      await Share.share({
        message,
        title: "Lista de Churrasco",
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível compartilhar a lista");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome name="fire" size={40} color={colors.primary} />
          <Text style={styles.title}>Churrascômetro</Text>
          <Text style={styles.subtitle}>Calcule as quantidades ideais para o seu churrasco</Text>
        </View>

        {/* Seção de Entrada */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 Convidados</Text>
          <View style={styles.card}>
            <Counter
              label="Adultos Carnívoros"
              value={meatAdults}
              onChange={setMeatAdults}
              min={0}
              max={100}
              icon="user"
            />
            <Counter
              label="Adultos Vegetarianos"
              value={vegetarianAdults}
              onChange={setVegetarianAdults}
              min={0}
              max={100}
              icon="leaf"
            />
            <Counter
              label="Crianças"
              value={children}
              onChange={setChildren}
              min={0}
              max={50}
              icon="child"
            />
            <Counter
              label="Bebedores de Cerveja"
              value={beerDrinkers}
              onChange={setBeerDrinkers}
              min={0}
              max={totalAdults}
              icon="beer"
            />
            <Counter
              label="Bebedores de Refrigerante"
              value={sodaDrinkers}
              onChange={setSodaDrinkers}
              min={0}
              max={totalParticipantsForSoda}
              icon="glass"
            />
          </View>
        </View>

        {/* Seção de Duração */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏱️ Duração do Evento</Text>
          <View style={styles.durationContainer}>
            <DurationOption
              duration={DURATIONS.short}
              isSelected={duration === "short"}
              onSelect={() => setDuration("short")}
            />
            <DurationOption
              duration={DURATIONS.long}
              isSelected={duration === "long"}
              onSelect={() => setDuration("long")}
            />
          </View>
        </View>

        {/* Seção de Opções */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Opções</Text>
          <View style={styles.card}>
            <ToggleOption
              label="Incluir Acompanhamentos"
              description="Arroz, farofa, vinagrete e pão de alho"
              value={includeSides}
              onChange={setIncludeSides}
              icon="cutlery"
            />
          </View>
        </View>

        {/* Seção de Seleção de Carnes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🥩 Tipos de Carne</Text>
          <Text style={styles.sectionSubtitle}>Toque para selecionar ou remover</Text>
          <MeatSelector selectedMeats={selectedMeats} onToggle={toggleMeat} />
        </View>

        {/* Resumo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Resumo</Text>
          <View style={styles.card}>
            <SummaryGrid
              participants={result.participants.total}
              totalMeat={result.totals.totalMeat}
              totalBeer={result.totals.totalBeer}
              totalSoda={result.totals.totalSoda}
              totalCharcoal={result.totals.totalCharcoal}
              totalCost={result.totals.totalCost}
            />
          </View>
        </View>

        {/* Resultados Detalhados */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🛒 Lista de Compras</Text>
          {result.sections.map((section) => (
            <ResultCard key={section.title} section={section} />
          ))}

          {/* Botão de Compartilhar */}
          <TouchableOpacity style={styles.shareButton} onPress={handleShare} activeOpacity={0.8}>
            <FontAwesome name="whatsapp" size={24} color="#FFFFFF" style={styles.shareButtonIcon} />
            <Text style={styles.shareButtonText}>Compartilhar Lista</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Dica: As quantidades são estimativas. Ajuste conforme o apetite dos seus convidados! 🍖
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============ ESTILOS ============

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: 32,
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
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Counter styles
  counterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  counterLabelRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  counterIcon: {
    marginRight: spacing.sm,
  },
  counterLabel: {
    fontSize: 16,
    color: colors.text,
  },
  counterControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  counterButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  counterButtonDisabled: {
    backgroundColor: colors.border,
  },
  counterValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.text,
    minWidth: 40,
    textAlign: "center",
  },

  // Duration styles
  durationContainer: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  durationOption: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.border,
  },
  durationOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}20`,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  durationLabelSelected: {
    color: colors.primary,
  },
  durationDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  durationDescriptionSelected: {
    color: colors.primary,
  },

  // Summary grid styles
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  summaryItem: {
    width: "48%",
    alignItems: "center",
    paddingVertical: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginTop: spacing.xs,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Result card styles
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  resultCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginLeft: spacing.sm,
  },
  resultCardItems: {},
  resultItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
  },
  resultItemLabel: {
    fontSize: 14,
    color: colors.text,
  },
  resultItemValue: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.secondary,
  },

  // Footer styles
  footer: {
    padding: spacing.lg,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    fontStyle: "italic",
  },

  // Toggle option styles
  toggleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background,
  },
  toggleOptionSelected: {
    backgroundColor: `${colors.primary}15`,
  },
  toggleOptionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  toggleIcon: {
    marginRight: spacing.sm,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
  },
  toggleLabelSelected: {
    color: colors.primary,
  },
  toggleDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  toggleDescriptionSelected: {
    color: colors.primary,
    opacity: 0.8,
  },
  toggleSwitch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: "center",
  },
  toggleSwitchActive: {
    backgroundColor: colors.primary,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  toggleKnobActive: {
    alignSelf: "flex-end",
  },

  // Section subtitle styles
  sectionSubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: -spacing.xs,
  },

  // Meat selector styles
  meatSelectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  meatChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    minWidth: 100,
  },
  meatChipSelected: {
    backgroundColor: `${colors.primary}20`,
    borderColor: colors.primary,
  },
  meatChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  meatChipTextSelected: {
    color: colors.primary,
  },
  meatChipPrice: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Summary highlight styles
  summaryItemHighlight: {
    backgroundColor: `${colors.success}15`,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
  },
  summaryValueHighlight: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.success,
    marginTop: spacing.xs,
  },

  // Share button styles
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#25D366",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  shareButtonIcon: {
    marginRight: spacing.sm,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
});
