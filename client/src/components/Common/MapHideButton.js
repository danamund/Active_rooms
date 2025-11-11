import React from 'react';

export default function MapHideButton({ onHide }) {
  return (
    <button
      onClick={onHide}
      style={{
        padding: '10px 20px',
        background: '#FF5722',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      🗺️ Hide Map
    </button>
  );
}