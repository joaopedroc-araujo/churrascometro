import { Alert } from "react-native";

/**
 * Utilitário centralizado para alertas consistentes
 */
export const alerts = {
  /**
   * Confirmação antes de excluir um item
   */
  confirmDelete: (itemName: string, onConfirm: () => void) => {
    Alert.alert(
      "Confirmar Exclusão",
      `Tem certeza que deseja excluir "${itemName}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: onConfirm },
      ]
    );
  },

  /**
   * Confirmação antes de limpar uma lista
   */
  confirmClear: (message: string, onConfirm: () => void) => {
    Alert.alert("Limpar Lista", message, [
      { text: "Cancelar", style: "cancel" },
      { text: "Limpar", style: "destructive", onPress: onConfirm },
    ]);
  },

  /**
   * Confirmação antes de restaurar padrões
   */
  confirmReset: (message: string, onConfirm: () => void) => {
    Alert.alert("Restaurar Padrão", message, [
      { text: "Cancelar", style: "cancel" },
      { text: "Restaurar", style: "destructive", onPress: onConfirm },
    ]);
  },

  /**
   * Alerta de sucesso
   */
  success: (title: string, message?: string) => {
    Alert.alert(title, message, [{ text: "OK" }]);
  },

  /**
   * Alerta de erro
   */
  error: (message: string, title = "Erro") => {
    Alert.alert(title, message, [{ text: "OK" }]);
  },

  /**
   * Alerta de aviso
   */
  warning: (title: string, message: string) => {
    Alert.alert(title, message, [{ text: "OK" }]);
  },

  /**
   * Diálogo de confirmação genérico
   */
  confirm: (
    title: string,
    message: string,
    confirmText: string,
    onConfirm: () => void,
    destructive = false
  ) => {
    Alert.alert(title, message, [
      { text: "Cancelar", style: "cancel" },
      {
        text: confirmText,
        style: destructive ? "destructive" : "default",
        onPress: onConfirm,
      },
    ]);
  },
};

export default alerts;
