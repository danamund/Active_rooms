// StatsCards component displays summary cards for room and sensor statistics
import React from 'react';

const StatsCards = ({ sensors, rooms }) => {
  // Render a grid of statistic cards
  return (
    <div style={{
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
      gap: '20px', 
      marginBottom: '30px'
    }}>
      {/* Card for available rooms (sensors with status 'available') */}
      <div style={{background: '#4CAF50', color: 'white', padding: '25px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}}>
        <div style={{fontSize: '32px', marginBottom: '12px'}}>✅</div>
        <h3 style={{margin: '0 0 8px 0', fontSize: '40px', fontWeight: 'bold'}}>{sensors.filter(s => s.status === 'available').length}</h3>
        <p style={{margin: 0, fontSize: '18px', fontWeight: '500'}}>Available Rooms</p>
      </div>
      
      {/* Card for occupied rooms (sensors with status 'occupied') */}
      <div style={{background: '#FF5722', color: 'white', padding: '25px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}}>
        <div style={{fontSize: '32px', marginBottom: '12px'}}>🔴</div>
        <h3 style={{margin: '0 0 8px 0', fontSize: '40px', fontWeight: 'bold'}}>{sensors.filter(s => s.status === 'occupied').length}</h3>
        <p style={{margin: 0, fontSize: '18px', fontWeight: '500'}}>Occupied Rooms</p>
      </div>
      
      {/* Card for error rooms (sensors with status 'error') */}
      <div style={{background: '#FFC107', color: 'white', padding: '25px', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}}>
        <div style={{fontSize: '32px', marginBottom: '12px'}}>⚠️</div>
        <h3 style={{margin: '0 0 8px 0', fontSize: '40px', fontWeight: 'bold'}}>{sensors.filter(s => s.status === 'error').length}</h3>
        <p style={{margin: 0, fontSize: '18px', fontWeight: '500'}}>Error Rooms</p>
      </div>
      
      {/* Card for total rooms */}
      <div style={{background: '#2196F3', color: 'white', padding: '25px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 4px 8px rgba(0,0,0,0.1)'}}>
        <div style={{fontSize: '32px', marginBottom: '12px'}}>🏠</div>
        <h3 style={{margin: '0 0 8px 0', fontSize: '40px', fontWeight: 'bold'}}>{rooms.length}</h3>
        <p style={{margin: 0, fontSize: '18px', fontWeight: '500'}}>Total Rooms</p>
      </div>
    </div>
  );
};

// Export the StatsCards component
export default StatsCards;