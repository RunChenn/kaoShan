import type { GeoJSON } from 'geojson'

export const mockCurrentPosition = {
  lng: 120.9575,
  lat: 23.4700,
  altitude: 3245,
  accuracy: 8,
}

export const trackGeoJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [120.9420, 23.4520],
          [120.9438, 23.4548],
          [120.9455, 23.4572],
          [120.9470, 23.4598],
          [120.9488, 23.4622],
          [120.9505, 23.4645],
          [120.9520, 23.4668],
          [120.9535, 23.4688],
          [120.9550, 23.4700],
          [120.9565, 23.4700],
          [120.9575, 23.4700],
        ],
      },
    },
  ],
}

export const heatmapGeoJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { intensity: 0.9 },
      geometry: { type: 'Point', coordinates: [120.9488, 23.4622] },
    },
    {
      type: 'Feature',
      properties: { intensity: 0.7 },
      geometry: { type: 'Point', coordinates: [120.9505, 23.4645] },
    },
    {
      type: 'Feature',
      properties: { intensity: 0.5 },
      geometry: { type: 'Point', coordinates: [120.9455, 23.4572] },
    },
    {
      type: 'Feature',
      properties: { intensity: 0.6 },
      geometry: { type: 'Point', coordinates: [120.9520, 23.4668] },
    },
  ],
}

export const deviationCircle = {
  center: [120.9540, 23.4690] as [number, number],
  radius: 150,
  active: true,
}
