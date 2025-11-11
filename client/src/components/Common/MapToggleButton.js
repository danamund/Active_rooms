import React from 'react';

export default function MapToggleButton({ showMap, onShow, onHide }) {
  if (showMap) {
    return null;
  }
return (
    <button
        style={{
            alignSelf: 'flex-end',
            marginBottom: '12px',
            padding: '8px 18px',
            background: '#2196F3',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontWeight: 'bold',
            cursor: 'pointer',
            fontSize: '1em',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
        }}
        onClick={onShow}
    >
        Show Map
    </button>
);
}