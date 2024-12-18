import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import { LatLngTuple } from 'leaflet';
import { Coordinates } from '../types/console';
import './Map.scss';

function ChangeView({ center, zoom }: { center: LatLngTuple; zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface MapProps {
  center: LatLngTuple;
  location?: string;
  coordinates?: Coordinates[];
}

export function Map({ center, location = 'Current Location', coordinates = [] }: MapProps) {
  // Convert Coordinates to LatLngTuple array for the polyline
  const positions: LatLngTuple[] = coordinates.map(coord => [coord.lat, coord.lng]);

  return (
    <div data-component="Map">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={true}
        zoomControl={true}
        attributionControl={false}
      >
        <ChangeView center={center} zoom={11} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Current position marker */}
        <Marker position={center}>
          <Popup>
            {location}
            {coordinates[coordinates.length - 1]?.temperature && (
              <div>
                Temperature: {coordinates[coordinates.length - 1].temperature?.value}
                {coordinates[coordinates.length - 1].temperature?.units}
              </div>
            )}
            {coordinates[coordinates.length - 1]?.wind_speed && (
              <div>
                Wind Speed: {coordinates[coordinates.length - 1].wind_speed?.value}
                {coordinates[coordinates.length - 1].wind_speed?.units}
              </div>
            )}
          </Popup>
        </Marker>

        {/* Movement path */}
        {positions.length > 1 && (
          <Polyline 
            positions={positions}
            color="blue"
            weight={3}
            opacity={0.7}
          />
        )}
      </MapContainer>
    </div>
  );
}
