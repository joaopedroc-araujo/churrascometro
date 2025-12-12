import * as Haptics from "expo-haptics";

/**
 * Utilitário centralizado para feedback háptico consistente em todo o app
 */
export const haptics = {
  /** Botões normais e interações leves */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Botões importantes e ações significativas */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Ações destrutivas ou muito importantes */
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /** Seleção de itens (toggle, radio, checkbox) */
  selection: () => Haptics.selectionAsync(),

  /** Feedback de sucesso (salvar, completar, etc.) */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Feedback de erro */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /** Feedback de aviso (deletar, limpar, etc.) */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

export default haptics;
