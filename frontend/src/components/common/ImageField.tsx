import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useImageUpload } from '@/hooks/uploads';
import { t } from '@/i18n';

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];

interface ImageFieldProps {
  // Uploaded image path; empty when the default is used.
  value: string;
  onChange: (url: string) => void;
  // Shows the photo when set, otherwise the default picture.
  preview: React.ReactNode;
  label?: string;
}

export const ImageField: React.FC<ImageFieldProps> = ({
  value,
  onChange,
  preview,
  label = t('Photo'),
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useImageUpload();
  const [error, setError] = useState<string | null>(null);

  const onFile = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError(t('Use a JPEG, PNG or WebP image.'));
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(t('The image must be 5 MB or smaller.'));
      return;
    }
    setError(null);
    try {
      const { url } = await upload.mutateAsync(file);
      onChange(url);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error ? uploadError.message : t('Upload failed.')
      );
    }
  };

  return (
    <div className="flex items-center gap-3">
      {preview}
      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="secondary"
            loading={upload.isPending}
            onClick={() => inputRef.current?.click()}
          >
            {value
              ? t('Change {{label}}', { label: label.toLowerCase() })
              : t('Upload {{label}}', { label: label.toLowerCase() })}
          </Button>
          {value ? (
            <Button size="sm" variant="ghost" onClick={() => onChange('')}>
              {t('Use default')}
            </Button>
          ) : null}
        </div>
        {error ? <p className="mt-1.5 text-xs text-danger">{error}</p> : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(',')}
        className="hidden"
        onChange={(event) => {
          void onFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </div>
  );
};
