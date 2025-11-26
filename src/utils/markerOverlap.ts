/**
 * Utility functions for preventing marker overlaps on maps
 */

export interface MarkerPosition {
  lat: number;
  lng: number;
  id: string;
  [key: string]: any; // Allow additional properties
}

export interface AdjustedPosition extends MarkerPosition {
  adjustedLat: number;
  adjustedLng: number;
}

/**
 * Configuration for overlap prevention
 */
interface OverlapConfig {
  minDistancePixels?: number; // Minimum distance between markers in pixels
  maxOffsetMeters?: number; // Maximum offset from original position in meters
  iterations?: number; // Number of iterations for the algorithm
}

const DEFAULT_MIN_DISTANCE_PIXELS = 50; // 50 pixels minimum separation
const DEFAULT_MAX_OFFSET_METERS = 50; // Don't move markers more than 50 meters
const DEFAULT_ITERATIONS = 10; // Number of iterations for convergence

/**
 * Converts a lat/lng coordinate to pixel coordinates on the map
 * @param lat - Latitude
 * @param lng - Longitude
 * @param map - Google Maps map instance
 * @returns Pixel coordinates {x, y} or null if map is not available
 */
function latLngToPixel(
  lat: number,
  lng: number,
  map: google.maps.Map | null
): { x: number; y: number } | null {
  if (!map) return null;

  const projection = map.getProjection();
  if (!projection) return null;

  const scale = Math.pow(2, map.getZoom() || 15);
  const worldCoordinate = projection.fromLatLngToPoint(
    new google.maps.LatLng(lat, lng)
  );

  const pixelCoordinate = {
    x: worldCoordinate.x * scale,
    y: worldCoordinate.y * scale
  };

  return pixelCoordinate;
}

/**
 * Converts pixel coordinates back to lat/lng
 * @param x - X pixel coordinate
 * @param y - Y pixel coordinate
 * @param map - Google Maps map instance
 * @returns Lat/lng coordinates or null if map is not available
 */
function pixelToLatLng(
  x: number,
  y: number,
  map: google.maps.Map | null
): { lat: number; lng: number } | null {
  if (!map) return null;

  const projection = map.getProjection();
  if (!projection) return null;

  const scale = Math.pow(2, map.getZoom() || 15);
  const worldCoordinate = {
    x: x / scale,
    y: y / scale
  };

  const latLng = projection.fromPointToLatLng(
    new google.maps.Point(worldCoordinate.x, worldCoordinate.y)
  );

  return {
    lat: latLng.lat(),
    lng: latLng.lng()
  };
}

/**
 * Calculates distance between two pixel coordinates
 */
function pixelDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculates distance between two lat/lng points in meters
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Prevents marker overlaps by adjusting positions
 * Uses a simple repulsion algorithm: markers that are too close push each other apart
 * @param markers - Array of marker positions
 * @param map - Google Maps map instance
 * @param config - Configuration options
 * @returns Array of markers with adjusted positions
 */
export function preventMarkerOverlap(
  markers: MarkerPosition[],
  map: google.maps.Map | null,
  config: OverlapConfig = {}
): AdjustedPosition[] {
  if (!map || markers.length === 0) {
    return markers.map(m => ({
      ...m,
      adjustedLat: m.lat,
      adjustedLng: m.lng
    }));
  }

  const {
    minDistancePixels = DEFAULT_MIN_DISTANCE_PIXELS,
    maxOffsetMeters = DEFAULT_MAX_OFFSET_METERS,
    iterations = DEFAULT_ITERATIONS
  } = config;

  // Convert all markers to pixel coordinates
  const pixelMarkers = markers.map(marker => {
    const pixel = latLngToPixel(marker.lat, marker.lng, map);
    return {
      ...marker,
      pixelX: pixel?.x ?? 0,
      pixelY: pixel?.y ?? 0,
      adjustedX: pixel?.x ?? 0,
      adjustedY: pixel?.y ?? 0
    };
  });

  // Apply repulsion algorithm iteratively
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < pixelMarkers.length; i++) {
      for (let j = i + 1; j < pixelMarkers.length; j++) {
        const marker1 = pixelMarkers[i];
        const marker2 = pixelMarkers[j];

        const distance = pixelDistance(
          { x: marker1.adjustedX, y: marker1.adjustedY },
          { x: marker2.adjustedX, y: marker2.adjustedY }
        );

        // If markers are too close, push them apart
        if (distance < minDistancePixels && distance > 0) {
          const overlap = minDistancePixels - distance;
          const pushDistance = overlap / 2; // Split the push between both markers

          // Calculate direction vector
          const dx = marker2.adjustedX - marker1.adjustedX;
          const dy = marker2.adjustedY - marker1.adjustedY;
          const length = Math.sqrt(dx * dx + dy * dy);

          if (length > 0) {
            // Normalize direction
            const unitX = dx / length;
            const unitY = dy / length;

            // Push markers apart
            marker1.adjustedX -= unitX * pushDistance;
            marker1.adjustedY -= unitY * pushDistance;
            marker2.adjustedX += unitX * pushDistance;
            marker2.adjustedY += unitY * pushDistance;
          }
        }
      }
    }
  }

  // Convert back to lat/lng and apply distance constraint
  const result: AdjustedPosition[] = pixelMarkers.map(marker => {
    const originalLatLng = pixelToLatLng(
      marker.pixelX,
      marker.pixelY,
      map
    );
    const adjustedLatLng = pixelToLatLng(
      marker.adjustedX,
      marker.adjustedY,
      map
    );

    if (!originalLatLng || !adjustedLatLng) {
      return {
        ...marker,
        adjustedLat: marker.lat,
        adjustedLng: marker.lng
      };
    }

    // Check if adjustment is within max offset
    const offsetMeters = haversineDistance(
      originalLatLng.lat,
      originalLatLng.lng,
      adjustedLatLng.lat,
      adjustedLatLng.lng
    );

    // If offset is too large, use original position
    if (offsetMeters > maxOffsetMeters) {
      return {
        ...marker,
        adjustedLat: marker.lat,
        adjustedLng: marker.lng
      };
    }

    return {
      ...marker,
      adjustedLat: adjustedLatLng.lat,
      adjustedLng: adjustedLatLng.lng
    };
  });

  return result;
}

/**
 * Simplified version that works with zoom level instead of map instance
 * Useful when map instance is not immediately available
 */
export function preventMarkerOverlapSimple(
  markers: MarkerPosition[],
  zoom: number,
  center: { lat: number; lng: number },
  config: OverlapConfig = {}
): AdjustedPosition[] {
  if (markers.length === 0) {
    return markers.map(m => ({
      ...m,
      adjustedLat: m.lat,
      adjustedLng: m.lng
    }));
  }

  const {
    minDistancePixels = DEFAULT_MIN_DISTANCE_PIXELS,
    maxOffsetMeters = DEFAULT_MAX_OFFSET_METERS,
    iterations = DEFAULT_ITERATIONS
  } = config;

  // Approximate pixel conversion using zoom level
  // At zoom level z, 1 degree latitude ≈ 256 * 2^z pixels
  const pixelsPerDegree = 256 * Math.pow(2, zoom);
  const metersPerDegreeLat = 111320; // Approximately constant
  const metersPerDegreeLng = 111320 * Math.cos((center.lat * Math.PI) / 180);

  // Convert to pixel space
  const pixelMarkers = markers.map(marker => {
    const pixelX = (marker.lng - center.lng) * pixelsPerDegree * Math.cos((center.lat * Math.PI) / 180);
    const pixelY = (marker.lat - center.lat) * pixelsPerDegree;
    return {
      ...marker,
      pixelX,
      pixelY,
      adjustedX: pixelX,
      adjustedY: pixelY
    };
  });

  // Apply repulsion
  for (let iter = 0; iter < iterations; iter++) {
    for (let i = 0; i < pixelMarkers.length; i++) {
      for (let j = i + 1; j < pixelMarkers.length; j++) {
        const marker1 = pixelMarkers[i];
        const marker2 = pixelMarkers[j];

        const dx = marker2.adjustedX - marker1.adjustedX;
        const dy = marker2.adjustedY - marker1.adjustedY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < minDistancePixels && distance > 0) {
          const overlap = minDistancePixels - distance;
          const pushDistance = overlap / 2;
          const unitX = dx / distance;
          const unitY = dy / distance;

          marker1.adjustedX -= unitX * pushDistance;
          marker1.adjustedY -= unitY * pushDistance;
          marker2.adjustedX += unitX * pushDistance;
          marker2.adjustedY += unitY * pushDistance;
        }
      }
    }
  }

  // Convert back to lat/lng
  const result: AdjustedPosition[] = pixelMarkers.map(marker => {
    const adjustedLat = center.lat + marker.adjustedY / pixelsPerDegree;
    const adjustedLng = center.lng + marker.adjustedX / (pixelsPerDegree * Math.cos((center.lat * Math.PI) / 180));

    // Check offset constraint
    const offsetMeters = haversineDistance(
      marker.lat,
      marker.lng,
      adjustedLat,
      adjustedLng
    );

    if (offsetMeters > maxOffsetMeters) {
      return {
        ...marker,
        adjustedLat: marker.lat,
        adjustedLng: marker.lng
      };
    }

    return {
      ...marker,
      adjustedLat,
      adjustedLng
    };
  });

  return result;
}

