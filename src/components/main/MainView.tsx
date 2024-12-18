import React from 'react';
import { useConsole } from '../../contexts/ConsoleContext';
import { Map } from '../Map';
import { StudentList } from '../student/StudentList';
import './MainView.scss';

export function MainView() {
  const { canvasKv, coords, marker, memoryKv } = useConsole();
  const defaultCenter: [number, number] = [37.5665, 126.9780]; // Seoul coordinates

  // If there's a marker, use it as the center
  const center = marker
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
          />
        </div>
      </div>
      <div className="student-list-container">
        <StudentList memoryKv={memoryKv} />
      </div>
    </div>
  );
}
