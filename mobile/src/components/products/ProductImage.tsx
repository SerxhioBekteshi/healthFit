import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { assetUrl } from '@/api/client';
import { Icon, type IconName } from '@/components/ui/Icon';
import { useTranslation } from '@/i18n';
import { useThemedStyles, type Theme } from '@/theme';
import { productCategoryLabels } from '@/utils/labels';
import type { ProductCategory } from '@gym/shared/types';

interface ProductImageProps {
  category: ProductCategory;
  // Uploaded photo path; the icon of the category shows when it is empty.
  imageUrl?: string;
  name?: string;
}

const categoryIcons: Record<ProductCategory, IconName> = {
  supplement: 'fitness-outline',
  snack: 'fast-food-outline',
  drink: 'water-outline',
  merchandise: 'shirt-outline',
  shake: 'beaker-outline',
  smoothie: 'nutrition-outline',
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    box: {
      width: 64,
      height: 64,
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.accentSoft,
    },
    photo: { width: '100%', height: '100%' },
  });

export const ProductImage: React.FC<ProductImageProps> = ({
  category,
  imageUrl,
  name = '',
}) => {
  const styles = useThemedStyles(createStyles);
  useTranslation();

  return (
    <View style={styles.box}>
      {imageUrl ? (
        <Image
          source={{ uri: assetUrl(imageUrl) }}
          style={styles.photo}
          contentFit="cover"
          accessibilityLabel={name || productCategoryLabels[category]}
        />
      ) : (
        <Icon name={categoryIcons[category]} size={30} color="accent" />
      )}
    </View>
  );
};
