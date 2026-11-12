import React, { useRef, useState } from 'react';
import { PhotoGallery } from '@/components/membership-plans/PhotoGallery';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { usePriceList } from '@/hooks/price-lists';
import { t } from '@/i18n';
import type { PriceListPhoto } from '@gym/shared/types';
import { MAX_PRICE_LIST_PHOTOS } from '@gym/shared/validation/price-lists';

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 5 * 1024 * 1024;

// Upload and remove the gym photos shown with the price list.
export const PriceListPhotosManager: React.FC = () => {
  const { photos, uploadPhoto, deletePhoto } = usePriceList();
  const inputRef = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<PriceListPhoto | null>(null);

  const onFiles = async (files: FileList | null): Promise<void> => {
    setProblem(null);
    for (const file of Array.from(files ?? [])) {
      if (!ACCEPTED.includes(file.type)) {
        setProblem(t('Only JPEG, PNG or WebP images are allowed.'));
        break;
      }
      if (file.size > MAX_BYTES) {
        setProblem(t('Each photo must be 5 MB or smaller.'));
        break;
      }
      try {
        await uploadPhoto.mutateAsync(file);
      } catch (error) {
        setProblem(
          error instanceof Error ? error.message : t('Upload failed.')
        );
        break;
      }
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const confirmRemove = async (): Promise<void> => {
    if (!toRemove) return;
    try {
      await deletePhoto.mutateAsync(toRemove.id);
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : t('Could not remove.')
      );
    }
    setToRemove(null);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-bone/60">
          {t('{{n}} of {{max}} photos. JPEG, PNG or WebP, up to 5 MB each.', {
            n: photos.length,
            max: MAX_PRICE_LIST_PHOTOS,
          })}
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          className="sr-only"
          id="price-list-photos"
          onChange={(event) => void onFiles(event.target.files)}
        />
        <Button
          icon="plus"
          loading={uploadPhoto.isPending}
          disabled={photos.length >= MAX_PRICE_LIST_PHOTOS}
          onClick={() => inputRef.current?.click()}
        >
          {t('Upload photos')}
        </Button>
      </div>

      {problem ? <Alert>{problem}</Alert> : null}

      {photos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 px-6 py-10 text-center text-sm text-bone/50">
          {t(
            'No photos yet. Members will see the photos you add under the price list.'
          )}
        </div>
      ) : (
        <PhotoGallery
          photos={photos}
          removing={deletePhoto.isPending}
          onRemove={setToRemove}
        />
      )}

      <Modal
        isOpen={toRemove !== null}
        title={t('Remove this photo?')}
        description={t('Members will no longer see it on the price list.')}
        size="sm"
        onClose={() => setToRemove(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToRemove(null)}>
              {t('Cancel')}
            </Button>
            <Button
              variant="danger"
              loading={deletePhoto.isPending}
              onClick={confirmRemove}
            >
              {t('Remove')}{' '}
            </Button>
          </>
        }
      />
    </div>
  );
};
