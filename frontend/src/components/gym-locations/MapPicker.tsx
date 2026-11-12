import React, { useCallback, useState } from 'react';
import Map, {
  Marker,
  NavigationControl,
  type MapLayerMouseEvent,
  type MarkerDragEvent,
} from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Icon } from '@/components/ui/Icon';
import { msg, t, translated } from '@/i18n';
import { DEFAULT_CENTER, mapStyles, type MapStyleKey } from './mapStyles';

interface MapPickerProps {
  latitude?: number | null;
  longitude?: number | null;
  // Where the map opens; the form fills the pin in after it mounts, so the saved spot comes from here.
  initialCenter?: { latitude: number; longitude: number } | null;
  onChange: (latitude: number, longitude: number) => void;
}

const styleLabels = translated<MapStyleKey>({
  street: msg('Street'),
  satellite: msg('Satellite'),
});

// Click the map or drag the pin to set where the gym is.
export const MapPicker: React.FC<MapPickerProps> = ({
  latitude,
  longitude,
  initialCenter,
  onChange,
}) => {
  const [style, setStyle] = useState<MapStyleKey>('street');
  const hasPin = latitude != null && longitude != null;

  const onClick = useCallback(
    (event: MapLayerMouseEvent): void =>
      onChange(event.lngLat.lat, event.lngLat.lng),
    [onChange]
  );
  const onDragEnd = useCallback(
    (event: MarkerDragEvent): void =>
      onChange(event.lngLat.lat, event.lngLat.lng),
    [onChange]
  );

  return (
    <div className="relative h-[320px] w-full overflow-hidden rounded-xl border border-white/10">
      <Map
        initialViewState={{
          latitude: initialCenter?.latitude ?? DEFAULT_CENTER.latitude,
          longitude: initialCenter?.longitude ?? DEFAULT_CENTER.longitude,
          zoom: initialCenter ? 15 : 12,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyles[style]}
        onClick={onClick}
        cursor="crosshair"
      >
        <NavigationControl position="top-right" showCompass={false} />
        {hasPin ? (
          <Marker
            latitude={latitude}
            longitude={longitude}
            anchor="bottom"
            draggable
            onDragEnd={onDragEnd}
          >
            <Icon
              name="pin"
              className="h-9 w-9 fill-danger/30 text-danger drop-shadow-lg"
            />
          </Marker>
        ) : null}
      </Map>

      <div
        role="group"
        aria-label={t('Map style')}
        className="absolute bottom-3 left-3 z-10 flex gap-1 rounded-lg border border-white/10 bg-ink/85 p-1 backdrop-blur"
      >
        {(Object.keys(styleLabels) as MapStyleKey[]).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={style === key}
            onClick={() => setStyle(key)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              style === key
                ? 'bg-signal text-ink'
                : 'text-bone/65 hover:text-bone'
            }`}
          >
            {styleLabels[key]}
          </button>
        ))}
      </div>
    </div>
  );
};
