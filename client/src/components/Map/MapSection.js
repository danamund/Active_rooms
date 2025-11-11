import React, { useState, useEffect } from 'react';
import Map from '../Map';
import MapHideButton from '../Common/MapHideButton';
import MapUploadButton from './MapUploadButton';

const MapSection = ({
  showMap,
  onToggleMap,
  sensors,
  rooms,
  onSensorClick,
  onMapClick,
  onAddRoomFromMap,
  user,
  onMapUploaded,
  mapCode
}) => {
  const [selectedMapCode, setSelectedMapCode] = useState(mapCode || null);

  const mapImageUrl = selectedMapCode
    ? `/uploads/maps/${selectedMapCode}.jpg`
    : '';

  useEffect(() => {
    setSelectedMapCode(mapCode || null);
  }, [mapCode]);

  return (
    <div>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2>🗺️ Campus Map - Sensors & Rooms Locations</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Use the new component */}
          <MapUploadButton
            user={user}
            onSuccess={({ map_code }) => {
              if (map_code) {
                setSelectedMapCode(map_code); 
                onMapUploaded?.(map_code);
                if (!showMap) onToggleMap?.();
              }
            }}
          />
          {showMap && <MapHideButton onHide={onToggleMap} />}
        </div>
      </div>

      {showMap && (
        <Map
          sensors={sensors}
          rooms={rooms}
          onSensorClick={onSensorClick}
          onMapClick={onMapClick}
          onAddRoomFromMap={(coords) => {
            console.log('🧭 Adding room with coords:', coords);
            console.log('📌 selectedMapCode:', selectedMapCode);
            onAddRoomFromMap?.({ ...coords, map_code: selectedMapCode });
          }}  
          user={user}
          mapImageUrl={mapImageUrl}
          mapCode={selectedMapCode}   
        />
      )}
    </div>
  );
};

export default MapSection;
