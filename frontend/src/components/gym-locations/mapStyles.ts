import type { StyleSpecification } from 'maplibre-gl';

export type MapStyleKey = 'street' | 'satellite';

const rasterStyle = (
  tiles: string,
  attribution: string,
  maxzoom: number
): StyleSpecification => ({
  version: 8,
  sources: {
    base: {
      type: 'raster',
      tiles: [tiles],
      tileSize: 256,
      attribution,
      maxzoom,
    },
  },
  layers: [{ id: 'base', type: 'raster', source: 'base' }],
});

// Raster tiles need no API key; swap these for a vector style URL if a provider is added.
export const mapStyles: Record<MapStyleKey, StyleSpecification> = {
  street: rasterStyle(
    'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    '&copy; OpenStreetMap contributors',
    19
  ),
  satellite: rasterStyle(
    'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    'Tiles &copy; Esri',
    18
  ),
};

// Tirana, used until a pin exists.
export const DEFAULT_CENTER = { latitude: 41.3275, longitude: 19.8187 };
