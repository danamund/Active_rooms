// SensorsSection component displays a list of sensors and allows admin actions
import React from 'react';

const SensorsSection = ({ 
  sensors, 
  user, 
  loading, 
  onAddSensor, 
  onEditSensor, 
  onDeleteSensor,
  getFullRoomLabel 
}) => {
  // Render sensors section with add/edit/delete options for admin
  return (
    <div style={{
      background: 'white', 
      padding: '20px', 
      borderRadius: '8px', 
      marginBottom: '20px'
    }}>
      {/* Header with add button for admin */}
      <div style={{
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '20px'
      }}>
        <h2>Sensors ({sensors.length})</h2>
        {user.role === 'admin' && (
          <button
            onClick={onAddSensor}
            style={{
              padding: '10px',
              background: '#4CAF50',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: 15,
              cursor: 'pointer',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
            }}
          >
            ➕ Add Sensor
          </button>
        )}
      </div>
      
      {/* Sensors grid */}
      <div style={{
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '15px'
      }}>
        {/* Render each sensor card */}
        {sensors.map(sensor => (
          <div
            key={sensor.id}
            style={{
              padding: '15px',
              borderRadius: '8px',
              color: 'white',
              backgroundColor: sensor.status === 'available' ? '#4CAF50' : 
                             sensor.status === 'occupied' ? '#FF5722' : '#FFC107',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Edit and delete buttons for admin */}
            {user.role === 'admin' && (
              <>
                <button
                  onClick={() => onEditSensor(sensor)}
               style={{
                  position: 'absolute',
                  top: '5px',
                  left: '5px',
                  background: '#0000004d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '13px'
                }}
                title="Edit Sensor"
              >
                ✏️
                </button>
                <button
                  onClick={() => onDeleteSensor(sensor.id)}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: '#0000004d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                  title="Delete Sensor"
                >
                  ✕
                </button>
              </>
            )}
            {/* Sensor info */}
            📡 {sensor.id} - {sensor.status}
            <br />
            <small>Room: {getFullRoomLabel(sensor.room_id)}</small>
            <br />
            <small>Position: ({sensor.x}, {sensor.y})</small>
          </div>
        ))}
      </div>
    </div>
  );
};

// Export the SensorsSection component
export default SensorsSection;