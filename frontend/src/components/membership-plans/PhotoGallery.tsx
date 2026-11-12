import React from 'react';
import { Icon } from '@/components/ui/Icon';
import { assetUrl } from '@/services/api';
import { t } from '@/i18n';
import type { PriceListPhoto } from '@gym/shared/types';

interface PhotoGalleryProps {
  photos: PriceListPhoto[];
  // Gym admins get a delete button on every photo.
  onRemove?: (photo: PriceListPhoto) => void;
  removing?: boolean;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  photos,
  onRemove,
  removing = false,
}) => {
  if (photos.length === 0) {
    return null;
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {photos.map((photo, index) => (
        <li
          key={photo.id}
          className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 bg-graphite"
        >
          <img
            src={assetUrl(photo.url)}
            alt={t('Gym photo {{n}}', { n: index + 1 })}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {onRemove ? (
            <button
              type="button"
              disabled={removing}
              aria-label={t('Remove photo {{n}}', { n: index + 1 })}
              onClick={() => onRemove(photo)}
              className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-danger disabled:opacity-50"
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          ) : null}
        </li>
      ))}
    </ul>
  );
};
