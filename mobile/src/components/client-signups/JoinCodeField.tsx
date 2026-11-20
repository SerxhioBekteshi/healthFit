import React from 'react';
import { TextField } from '@/components/ui/TextField';
import { useTranslation } from '@/i18n';

interface JoinCodeFieldProps {
  value: string;
  onChange: (value: string) => void;
  isInvalid: boolean;
}

// Optional: the link or code a gym gave the member. Without it the member joins the community.
export const JoinCodeField: React.FC<JoinCodeFieldProps> = ({
  value,
  onChange,
  isInvalid,
}) => {
  const { t } = useTranslation();
  return (
    <TextField
      label={t('Gym join code or link (optional)')}
      hint={t('Paste the link or code your gym gave you.')}
      error={
        isInvalid
          ? t('This join link is invalid or no longer active.')
          : undefined
      }
      value={value}
      onChangeText={onChange}
      keyboardType="url"
    />
  );
};
