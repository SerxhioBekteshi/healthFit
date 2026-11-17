import React from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme, type Colors } from '@/theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface IconProps {
  name: IconName;
  size?: number;
  // A colour of the theme, so icons follow light and dark mode.
  color?: keyof Colors;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color = 'textMuted',
}) => {
  const { colors } = useTheme();
  return <Ionicons name={name} size={size} color={colors[color]} />;
};
