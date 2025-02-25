import { DEFAULT_CENTER } from '~/libs/packages/map/libs/constants/constants.js';
import { type MapService } from '~/libs/packages/map/map.package.js';
import { MapConnector } from '~/libs/packages/map/map-connector.package.js';

import { getBounds } from './get-bounds.helper.js';

const setMapService = ({
  points,
  center,
  mapReference,
  mapService,
  zoom,
}: {
  points: google.maps.LatLngLiteral[] | undefined;
  center: google.maps.LatLngLiteral | null;
  mapReference: React.RefObject<HTMLDivElement>;
  mapService: { current: MapService | null };
  zoom: number;
}): void => {
  if (!points) {
    mapService.current = new MapConnector().getMapService({
      mapElement: mapReference.current,
      center: center ?? DEFAULT_CENTER,
      zoom,
    });
  } else if (points.length === 1) {
    const [center] = points;
    mapService.current = new MapConnector().getMapService({
      mapElement: mapReference.current,
      center: center,
      zoom,
    });
    mapService.current.addMarker(center, false);
  } else {
    const bounds = getBounds(points);

    mapService.current = new MapConnector().getMapService({
      mapElement: mapReference.current,
      bounds: bounds,
      zoom,
    });
    for (const point of points) {
      mapService.current.addMarker(point, false);
    }
  }
};

export { setMapService };
