import React from 'react';
import Map, { Marker } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Icon } from '@/components/ui/Icon';
import { mapStyles } from './mapStyles';

interface LocationMapProps {
  latitude: number;
  longitude: number;
  className?: string;
}

// A fixed map with the gym's pin; members open it in Google Maps from the link beside it.
export const LocationMap: React.FC<LocationMapProps> = ({
  latitude,
  longitude,
  className = 'h-44',
}) => (
  <div
    className={`w-full overflow-hidden rounded-xl border border-white/10 ${className}`}
  >
    <Map
      initialViewState={{ latitude, longitude, zoom: 15 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyles.street}
      interactive={false}
    >
      <Marker latitude={latitude} longitude={longitude} anchor="bottom">
        <Icon
          name="pin"
          className="h-8 w-8 fill-danger/30 text-danger drop-shadow-lg"
        />
      </Marker>
    </Map>
  </div>
);
