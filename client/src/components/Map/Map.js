import React, { useState, useEffect } from 'react';
import SensorMarker from './SensorMarker';
import MapLegend from './MapLegend';
import RoomMarker from './RoomMarker';
import MapUploadForm from './MapUploadForm';

// Modal for choosing between room/sensor
function ChooseAddTypeModal({ x, y, onChoose, onCancel }) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.3)', zIndex: 2000,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onCancel}>
      <div style={{ background: 'white', padding: 24, borderRadius: 10, minWidth: 260 }} onClick={e => e.stopPropagation()}>
        <h4 style={{marginBottom:16}}>What would you like to add?</h4>
        <button style={{width:'100%',marginBottom:10,padding:10,background:'#2196f3',color:'white',border:'none',borderRadius:6,fontSize:16,cursor:'pointer'}} onClick={()=>onChoose('room')}>Add Room</button>
        <button style={{width:'100%',marginBottom:10,padding:10,background:'#4caf50',color:'white',border:'none',borderRadius:6,fontSize:16,cursor:'pointer'}} onClick={()=>onChoose('sensor')}>Add Sensor</button>
        <button style={{width:'100%',padding:10,background:'#f44336',color:'white',border:'none',borderRadius:6,fontSize:16,cursor:'pointer'}} onClick={onCancel}>Cancel</button>
        <div style={{marginTop:16,fontSize:13,color:'#888'}}>x: {x} | y: {y}</div>
      </div>
    </div>
  );
}

const Map = ({
  sensors,
  rooms,
  onSensorClick,
  onMapClick,
  onAddRoomFromMap,
  user,
  mapImageUrl,
  mapCode, 
}) => {
  const [mapDimensions, setMapDimensions] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [chooseType, setChooseType] = useState(null); // {x, y} or null

  const code = (mapCode || '').toUpperCase();
  // Priority:
  // 1) If there is mapImageUrl from parent → use it
  // 2) Otherwise, do not display a map at all
  const resolvedUrl = mapImageUrl || '';

  // Load the image on every resolvedUrl change
  useEffect(() => {
    setImageLoaded(false);
    if (!resolvedUrl) { setMapDimensions({ width: 0, height: 0 }); return; }
    const img = new Image();
    img.onload = () => {
      setMapDimensions({ width: img.width, height: img.height });
      setImageLoaded(true);
    };
    img.src = resolvedUrl;
  }, [resolvedUrl]);

  // Convert sensor/room coordinates to map pixels
  const getSensorPosition = (item, containerWidth, containerHeight) => {
    if (!mapDimensions.width || !mapDimensions.height) return { x: 0, y: 0 };
    const scaleX = containerWidth / 800;
    const scaleY = containerHeight / 600;
    return { x: item.x * scaleX, y: item.y * scaleY };
  };

  const handleMapClick = (e) => {
    if (e.target.closest('.sensor-marker')) return;
    if (!user || user.role !== 'admin') return;
    const rect = e.target.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) * 800 / rect.width);
    const y = Math.round((e.clientY - rect.top) * 600 / rect.height);
    setChooseType({ x, y });
  };

  const handleChooseType = (type) => {
    if (type === 'sensor') {
      onMapClick && onMapClick(chooseType.x, chooseType.y);
    } else if (type === 'room') {
      onAddRoomFromMap && onAddRoomFromMap(chooseType);
    }
    setChooseType(null);
  };

  if (!resolvedUrl) {
    return (
      <div style={{ padding:'40px', textAlign:'center', background:'#f5f5f5', borderRadius:'8px' }}>
        <div style={{ fontSize:'24px', marginBottom:'10px' }}>🗺️</div>
        <div>No campus map available.</div>
      </div>
    );
  }
  if (!imageLoaded) {
    return (
      <div style={{ padding:'40px', textAlign:'center', background:'#f5f5f5', borderRadius:'8px' }}>
        <div style={{ fontSize:'24px', marginBottom:'10px' }}>🗺️</div>
        <div>Loading campus map...</div>
      </div>
    );
  }

  return (
    <div style={{ background:'white', padding:'20px', borderRadius:'8px', marginBottom:'20px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
        <MapLegend />
      </div>

      <div
        style={{
          position:'relative',
          width:'100%',
          maxWidth:'1200px',
          margin:'0 auto',
          border:'2px solid #ddd',
          borderRadius:'8px',
          overflow:'hidden',
          boxShadow:'0 4px 8px rgba(0,0,0,0.1)'
        }}
        onClick={handleMapClick}
      >
        {/* Map image */}
        <img
          src={resolvedUrl}
          alt={resolvedUrl ? `${code || 'Map'} Campus Map` : 'No map'}
          style={{ width:'100%', height:'auto', display:'block' }}
          onLoad={(e) => {
            const rect = e.target.getBoundingClientRect();
            setMapDimensions({ width: rect.width, height: rect.height });
          }}
        />

        {/* Rooms */}
        {rooms && rooms
          .filter(r => r.x !== undefined && r.y !== undefined && r.x !== '' && r.y !== '')
          .map(room => {
            const pos = getSensorPosition(room, mapDimensions.width, mapDimensions.height);
            return <RoomMarker key={room.id} room={room} pos={pos} />;
          })}

        {/* Sensors */}
        {sensors.map(sensor => {
          const position = getSensorPosition(sensor, mapDimensions.width, mapDimensions.height);
          return (
            <SensorMarker
              key={sensor.id}
              sensor={sensor}
              position={position}
              onClick={(e) => e.stopPropagation()}
              rooms={rooms}
              className="sensor-marker"
            />
          );
        })}

        {/* Choose add type modal */}
        {chooseType && user && user.role === 'admin' && (
          <ChooseAddTypeModal
            x={chooseType.x}
            y={chooseType.y}
            onChoose={handleChooseType}
            onCancel={() => setChooseType(null)}
          />
        )}
      </div>

      {/* Stats */}
      <div style={{ marginTop:'20px', display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:'10px' }}>
        <div style={{ background:'#4CAF50', color:'white', padding:'15px', borderRadius:'6px', textAlign:'center' }}>
          <div style={{ fontSize:'24px', fontWeight:'bold' }}>{sensors.filter(s => s.status === 'available').length}</div>
          <div style={{ fontSize:'12px' }}>Available Sensors</div>
        </div>
        <div style={{ background:'#FF5722', color:'white', padding:'15px', borderRadius:'6px', textAlign:'center' }}>
          <div style={{ fontSize:'24px', fontWeight:'bold' }}>{sensors.filter(s => s.status === 'occupied').length}</div>
          <div style={{ fontSize:'12px' }}>Occupied Sensors</div>
        </div>
        <div style={{ background:'#FFC107', color:'white', padding:'15px', borderRadius:'6px', textAlign:'center' }}>
          <div style={{ fontSize:'24px', fontWeight:'bold' }}>{sensors.filter(s => s.status === 'error').length}</div>
          <div style={{ fontSize:'12px' }}>Error Sensors</div>
        </div>
        <div style={{ background:'#2196F3', color:'white', padding:'15px', borderRadius:'6px', textAlign:'center' }}>
          <div style={{ fontSize:'24px', fontWeight:'bold' }}>{sensors.length}</div>
          <div style={{ fontSize:'12px' }}>Total Sensors</div>
        </div>
      </div>
    </div>
  );
};

export default Map;
