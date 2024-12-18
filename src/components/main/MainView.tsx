import React from 'react';
import { useConsole } from '../../contexts/ConsoleContext';
import { Map } from '../Map';
import { StudentList } from '../student/StudentList';
import './MainView.scss';

export function MainView() {
  const { canvasKv, coords, marker, memoryKv } = useConsole();
  const defaultCenter: [number, number] = [37.5665, 126.9780]; // Seoul coordinates

  // Get center coordinates based on priority:
  // 1. Route origin (if route exists)
  // 2. Marker position (if exists)
  // 3. Default Seoul coordinates
  const center = memoryKv?.lastSuccessfulRoute
    ? [
        parseFloat(memoryKv.lastSuccessfulRoute.origin.y),
        parseFloat(memoryKv.lastSuccessfulRoute.origin.x),
      ] as [number, number]
    : marker
    ? [marker.lat, marker.lng] as [number, number]
    : defaultCenter;

  return (
    <div className="main-view">
      <div className="map-container">
        <div className="content-block-body">
          <Map 
            center={center}
            coordinates={[coords]} // Convert single coordinate to array for consistency
            location={coords.location}
            routeData={memoryKv?.lastSuccessfulRoute} // Pass route data to Map component
          />
        </div>
      </div>
      <div className="student-list-container">
        <StudentList memoryKv={memoryKv} />
      </div>
    </div>
  );
}
