import React from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SelectableCard } from '@/components/ui/SelectableCard';
import { useTranslation } from '@/i18n';

export interface PickerOption<TValue extends string> {
  value: TValue;
  title: string;
  description?: string;
}

interface OptionSheetProps<TValue extends string> {
  visible: boolean;
  title: string;
  options: PickerOption<TValue>[];
  value: TValue;
  onSelect: (value: TValue) => void;
  onClose: () => void;
}

// A short "pick one" list in a sheet; tapping an option applies it and closes the sheet.
export const OptionSheet = <TValue extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: OptionSheetProps<TValue>): React.ReactElement => {
  const { t } = useTranslation();
  return (
    <BottomSheet
      visible={visible}
      title={title}
      onClose={onClose}
      cancelLabel={t('Close')}
    >
      {options.map((option) => (
        <SelectableCard
          key={option.value}
          title={option.title}
          description={option.description}
          selected={option.value === value}
          onPress={() => {
            onSelect(option.value);
            onClose();
          }}
        />
      ))}
    </BottomSheet>
  );
};
