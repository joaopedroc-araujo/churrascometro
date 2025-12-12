import { colors } from "@/constants/theme";
import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

/**
 * Overlay de carregamento para operações assíncronas
 */
export function LoadingOverlay({ visible, message = "Carregando..." }: LoadingOverlayProps) {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.container}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color={colors.primary} />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    backgroundColor: colors.surface,
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    minWidth: 150,
  },
  message: {
    color: colors.text,
    fontSize: 14,
    marginTop: 12,
    textAlign: "center",
  },
});

export default LoadingOverlay;
