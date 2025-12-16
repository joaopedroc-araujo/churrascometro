import { BottomAdBanner } from "@/components/ads";
import { borderRadius, colors, spacing } from "@/constants/theme";
import { deleteChurrasco, getSavedChurrascos, SavedChurrasco } from "@/services/storage-service";
import { alerts, haptics } from "@/utils";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: number): string {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

interface HistoryCardProps {
  churrasco: SavedChurrasco;
  onDelete: () => void;
}

function HistoryCard({ churrasco, onDelete }: HistoryCardProps) {
  const config = churrasco.config;
  const totalPeople = config.meatAdults + config.vegetarianAdults + config.children;

  const handleDelete = useCallback(() => {
    haptics.medium();
    alerts.confirm(
      "Remover do histórico?",
      `Deseja remover "${churrasco.name}" do histórico?`,
      "Remover",
      onDelete
    );
  }, [churrasco.name, onDelete]);

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      layout={Layout.springify()}
    >
      <View style={styles.historyCard}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{churrasco.name}</Text>
            <TouchableOpacity
              onPress={handleDelete}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="trash-o" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardDate}>{formatDate(churrasco.date)}</Text>
        </View>

        <View style={styles.cardStats}>
          <View style={styles.statItem}>
            <FontAwesome name="users" size={16} color={colors.secondary} />
            <Text style={styles.statValue}>{totalPeople}</Text>
            <Text style={styles.statLabel}>pessoas</Text>
          </View>

          <View style={styles.statItem}>
            <FontAwesome name="user" size={16} color={colors.primary} />
            <Text style={styles.statValue}>{config.meatAdults}</Text>
            <Text style={styles.statLabel}>carnívoros</Text>
          </View>

          <View style={styles.statItem}>
            <FontAwesome name="leaf" size={16} color={colors.success} />
            <Text style={styles.statValue}>{config.vegetarianAdults}</Text>
            <Text style={styles.statLabel}>vegetarianos</Text>
          </View>

          <View style={styles.statItem}>
            <FontAwesome name="child" size={16} color={colors.warning} />
            <Text style={styles.statValue}>{config.children}</Text>
            <Text style={styles.statLabel}>crianças</Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.durationBadge}>
            <FontAwesome name="clock-o" size={12} color={colors.textSecondary} />
            <Text style={styles.durationText}>
              {config.duration === "long" ? "Longo" : "Curto"}
            </Text>
          </View>

          <Text style={styles.totalCost}>{formatCurrency(churrasco.totalCost)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const [churrascos, setChurrascos] = useState<SavedChurrasco[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const data = await getSavedChurrascos();
      setChurrascos(data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
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

  const handleDelete = useCallback(async (id: string) => {
    haptics.success();
    await deleteChurrasco(id);
    setChurrascos((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const clearAllHistory = useCallback(() => {
    if (churrascos.length === 0) {
      return;
    }

    alerts.confirm(
      "Limpar histórico?",
      "Todos os churrascos salvos serão removidos. Esta ação não pode ser desfeita.",
      "Limpar Tudo",
      async () => {
        haptics.success();
        for (const c of churrascos) {
          await deleteChurrasco(c.id);
        }
        setChurrascos([]);
      }
    );
  }, [churrascos]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (churrascos.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <FontAwesome name="history" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>Nenhum histórico</Text>
          <Text style={styles.emptyText}>
            Seus churrascos salvos aparecerão aqui.{"\n"}
            Use o botão "Salvar Perfil" na calculadora!
          </Text>
        </View>
        <BottomAdBanner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome name="history" size={40} color={colors.secondary} />
          <Text style={styles.title}>Histórico</Text>
          <Text style={styles.subtitle}>
            {churrascos.length} {churrascos.length === 1 ? "churrasco salvo" : "churrascos salvos"}
          </Text>
        </View>

        {/* Lista de churrascos */}
        <View style={styles.section}>
          {churrascos.map((churrasco) => (
            <HistoryCard
              key={churrasco.id}
              churrasco={churrasco}
              onDelete={() => handleDelete(churrasco.id)}
            />
          ))}
        </View>

        {/* Botão limpar */}
        {churrascos.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={clearAllHistory}
            activeOpacity={0.7}
          >
            <FontAwesome name="trash" size={16} color={colors.textSecondary} />
            <Text style={styles.clearButtonText}>Limpar Histórico</Text>
          </TouchableOpacity>
        )}

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
    alignItems: "center",
    paddingVertical: spacing.lg,
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
  },
  section: {
    gap: spacing.md,
  },
  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    flex: 1,
  },
  cardDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cardStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  durationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    gap: 4,
  },
  durationText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  totalCost: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.success,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  clearButtonText: {
    fontSize: 14,
    color: colors.textSecondary,
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
    height: 80,
  },
});
