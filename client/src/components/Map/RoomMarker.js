import React from 'react';

const RoomMarker = ({ room, pos }) => (
  <div
    style={{
      position: 'absolute',
      left: pos.x - 18,
      top: pos.y - 18,
      width: 36,
      height: 36,
      background: 'rgba(33,150,243,0.25)',
      border: '2px solid #2196f3',
      borderRadius: 6,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#1565c0',
      fontWeight: 600,
      fontSize: 13,
      zIndex: 2,
      pointerEvents: 'none',
      boxShadow: '0 2px 8px rgba(33,150,243,0.10)'
    }}
    title={`Room: ${room.room_name || room.id}`}
  >
    {room.room_name || room.id}
  </div>
);

export default RoomMarker;