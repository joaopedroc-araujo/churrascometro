import { borderRadius, colors, spacing } from "@/constants/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Tip {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const TIPS: Tip[] = [
  {
    id: "1",
    icon: "thermometer",
    title: "Temperatura da Carne",
    description:
      "Retire a carne da geladeira 30 minutos antes de assar. Carne gelada cozinha de forma desigual e fica dura por fora e crua por dentro.",
  },
  {
    id: "2",
    icon: "fire",
    title: "Preparando o Carvão",
    description:
      "Use um acendedor de carvão ao invés de álcool. Deixe o carvão queimar até formar uma camada de cinza branca antes de começar a assar.",
  },
  {
    id: "3",
    icon: "clock-o",
    title: "Paciência é Fundamental",
    description:
      "Não fique virando a carne a todo momento. Deixe selar de um lado antes de virar. A picanha leva cerca de 25-30 minutos dependendo do ponto.",
  },
  {
    id: "4",
    icon: "tint",
    title: "Sal Grosso",
    description:
      "Sal grosso deve ser aplicado pouco antes de assar. Se salgar muito antes, a carne pode perder água e ficar seca.",
  },
  {
    id: "5",
    icon: "cut",
    title: "Corte Correto",
    description:
      "Sempre corte a carne contra as fibras. Isso deixa a carne mais macia e fácil de mastigar.",
  },
  {
    id: "6",
    icon: "hourglass-half",
    title: "Descanso da Carne",
    description:
      "Após retirar do fogo, deixe a carne descansar por 5 minutos antes de cortar. Isso permite que os sucos se redistribuam.",
  },
  {
    id: "7",
    icon: "beer",
    title: "Cerveja Gelada",
    description:
      "A temperatura ideal da cerveja é entre 2°C e 5°C. Use bastante gelo e mantenha as garrafas/latas bem enterradas.",
  },
  {
    id: "8",
    icon: "leaf",
    title: "Opções Vegetarianas",
    description:
      "Queijo coalho, abacaxi, cogumelos portobello e legumes grelhados são ótimas opções para vegetarianos no churrasco.",
  },
  {
    id: "9",
    icon: "sun-o",
    title: "Posição da Brasa",
    description:
      "Mantenha a brasa mais forte de um lado da churrasqueira. Assim você pode mover as carnes conforme o ponto desejado.",
  },
  {
    id: "10",
    icon: "star",
    title: "Ordem das Carnes",
    description:
      "Comece pelas carnes que levam mais tempo: costela e cupim. Linguiça e picanha vão depois. Frango e coração por último.",
  },
];

function TipCard({ tip }: { tip: Tip }) {
  return (
    <View style={styles.tipCard}>
      <View style={styles.tipIconContainer}>
        <FontAwesome name={tip.icon as any} size={24} color={colors.secondary} />
      </View>
      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipDescription}>{tip.description}</Text>
      </View>
    </View>
  );
}

export default function TipsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <StatusBar style="light" />
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <FontAwesome name="lightbulb-o" size={40} color={colors.secondary} />
          <Text style={styles.title}>Dicas de Churrasco</Text>
          <Text style={styles.subtitle}>
            Aprenda os segredos para um churrasco perfeito
          </Text>
        </View>

        {/* Tips List */}
        <View style={styles.section}>
          {TIPS.map((tip) => (
            <TipCard key={tip.id} tip={tip} />
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🥩 Bom churrasco para você! 🔥
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tipCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: spacing.xs,
  },
  tipDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: spacing.lg,
    alignItems: "center",
  },
  footerText: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
  },
});
