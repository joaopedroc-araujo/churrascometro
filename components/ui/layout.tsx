import { borderRadius, colors, spacing } from "@/constants/theme";
import styled from "styled-components/native";

export const Container = styled.View`
  flex: 1;
  background-color: ${colors.background};
`;

export const ScrollContainer = styled.ScrollView.attrs({
  contentContainerStyle: {
    paddingBottom: spacing.xxl,
  },
  showsVerticalScrollIndicator: false,
})`
  flex: 1;
  background-color: ${colors.background};
`;

export const Section = styled.View`
  padding: ${spacing.md}px;
`;

export const Card = styled.View`
  background-color: ${colors.surface};
  border-radius: ${borderRadius.lg}px;
  padding: ${spacing.md}px;
  margin-bottom: ${spacing.md}px;
  border-width: 1px;
  border-color: ${colors.border};
`;

interface RowProps {
  justify?: string;
  align?: string;
  gap?: number;
}

export const Row = styled.View<RowProps>`
  flex-direction: row;
  justify-content: ${(props: RowProps) => props.justify || "flex-start"};
  align-items: ${(props: RowProps) => props.align || "center"};
  gap: ${(props: RowProps) => props.gap || 0}px;
`;

interface SpacerProps {
  size?: number;
}

export const Spacer = styled.View<SpacerProps>`
  height: ${(props: SpacerProps) => props.size || spacing.md}px;
`;

export const Title = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: ${colors.text};
  text-align: center;
`;

export const Subtitle = styled.Text`
  font-size: 20px;
  font-weight: 600;
  color: ${colors.text};
`;

export const BodyText = styled.Text`
  font-size: 16px;
  color: ${colors.text};
`;

export const SecondaryText = styled.Text`
  font-size: 14px;
  color: ${colors.textSecondary};
`;

export const PrimaryButton = styled.TouchableOpacity`
  background-color: ${colors.primary};
  border-radius: ${borderRadius.lg}px;
  padding: ${spacing.md}px ${spacing.lg}px;
  align-items: center;
  justify-content: center;
`;

export const PrimaryButtonText = styled.Text`
  color: ${colors.white};
  font-size: 16px;
  font-weight: bold;
`;

export const IconButton = styled.TouchableOpacity`
  width: 48px;
  height: 48px;
  border-radius: ${borderRadius.round}px;
  background-color: ${colors.surface};
  align-items: center;
  justify-content: center;
  border-width: 1px;
  border-color: ${colors.border};
`;
