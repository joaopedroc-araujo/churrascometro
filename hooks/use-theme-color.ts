import { colors } from "@/constants/theme";

type ColorName = keyof typeof colors;

export function useThemeColor(colorName: ColorName): string {
  return colors[colorName];
}

export function getColor(colorName: ColorName): string {
  return colors[colorName];
}
