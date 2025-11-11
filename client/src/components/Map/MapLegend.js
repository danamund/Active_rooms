import React from 'react';

const MapLegend = () => {
  const legendItems = [
    { color: '#4CAF50', label: 'Available' },
    { color: '#FF5722', label: 'Occupied' },
    { color: '#FFC107', label: 'Error' }
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '15px',
      fontSize: '12px'
    }}>
      {legendItems.map(item => (
        <div key={item.label} style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '5px' 
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: item.color
          }}></div>
          {item.label}
        </div>
      ))}
    </div>
  );
};

export default MapLegend;