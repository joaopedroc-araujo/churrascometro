export const colors = {
  primary: "#E63946", // Vermelho churrasco
  secondary: "#F4A261", // Laranja/dourado
  background: "#1A1A2E", // Fundo escuro
  surface: "#16213E", // Cards
  text: "#EAEAEA", // Texto principal
  textSecondary: "#A0A0A0", // Texto secundário
  success: "#4CAF50", // Verde
  warning: "#FF9800", // Amarelo
  error: "#F44336", // Vermelho erro
  info: "#2196F3", // Azul informação
  border: "#2D3A5C",
  white: "#FFFFFF",
  black: "#000000",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const typography = {
  title: {
    fontSize: 28,
    fontWeight: "bold" as const,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "normal" as const,
  },
  caption: {
    fontSize: 14,
    fontWeight: "normal" as const,
  },
  small: {
    fontSize: 12,
    fontWeight: "normal" as const,
  },
};

const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
};

export default theme;
