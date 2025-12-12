import { colors, spacing } from "@/constants/theme";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary para capturar erros de renderização
 * e exibir uma UI de fallback amigável
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log do erro para debug
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <FontAwesome name="exclamation-triangle" size={60} color={colors.warning} />
          <Text style={styles.title}>Ops! Algo deu errado</Text>
          <Text style={styles.message}>{this.state.error?.message || "Erro desconhecido"}</Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <FontAwesome name="refresh" size={18} color="#FFF" />
            <Text style={styles.buttonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginTop: spacing.lg,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFF",
  },
});

export default ErrorBoundary;
