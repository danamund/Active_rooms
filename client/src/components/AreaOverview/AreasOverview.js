import React, { useState } from 'react';
import AddAreaModel from '../Modals/AddAreaModel';
import EditAreaModel from '../Modals/EditAreaModel';

const AreasOverview = ({ rooms, sensors, user, onAddArea, onDeleteArea, onEditArea, areas = [], mapCode }) => {
  const [showAddArea, setShowAddArea] = useState(false);
  const [editArea, setEditArea] = useState(null);

  const handleAddArea = (areaData) => {
    setShowAddArea(false);
    if (onAddArea) onAddArea(areaData);
  };

  const handleEditAreaSave = (updatedArea) => {
    setEditArea(null);
    if (onEditArea) onEditArea(updatedArea);
  };

  return (
    <div style={{background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <h2>Areas Overview</h2>
        {user?.role === 'admin' && (
          <button
            style={{
              background:'#43a047',color:'white',border:'none',borderRadius:6,padding:'8px 18px',fontSize:16,fontWeight:600,cursor:'pointer',display:'flex',alignItems:'center',gap:8,boxShadow:'0 1px 4px rgba(67,160,71,0.13)'
            }}
            aria-label="Add Area"
            onClick={() => setShowAddArea(true)}
          >
            <span style={{fontSize:22,lineHeight:1}}>➕</span> Add Area
          </button>
        )}
        <AddAreaModel isOpen={showAddArea} onClose={() => setShowAddArea(false)} onSave={handleAddArea} mapCode={mapCode}/>
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px',justifyContent: 'start',direction: 'ltr' }}>
        {areas
          .sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { numeric: true }))
          .map(area => {
            const areaRooms = rooms.filter(room => room.area === area.id || room.area_name === area.name);
            const areaSensors = sensors.filter(sensor =>
              areaRooms.some(room => room.id === sensor.room_id)
            );

            return (
              <div
                key={area.id ?? `area-${area.name}`}
                style={{
                  position: 'relative',
                  padding: '20px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
                }}
              >
                {user?.role === 'admin' && (
                  <>
                    {/*
                      Area delete button
                    */}
                    <button
                      onClick={() => onDeleteArea && onDeleteArea(area.id)}
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
                        fontSize: '12px',
                        zIndex: 0 // <-- Set to 0, or you can remove this line entirely
                      }}
                      title="Delete Area"
                    >
                      ✕
                    </button>
                    <button
                      onClick={() => setEditArea(area)}
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
                        fontSize: '13px',
                        zIndex: 0 // <-- Set to 0, or you can remove this line entirely
                      }}
                      title="Edit Area"
                    >
                      ✏️
                    </button>
                  </>
                )}

                <EditAreaModel
                  isOpen={!!editArea}
                  area={editArea}
                  onClose={() => setEditArea(null)}
                  onSave={handleEditAreaSave}
                />

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '15px',
                  borderBottom: '2px solid rgba(255,255,255,0.3)',
                  paddingBottom: '10px'
                }}>
                  <div style={{fontSize: '24px', marginRight: '10px'}}>🏢</div>
                  <h3 style={{margin: 0, fontSize: '20px', fontWeight: 'bold'}}>
                    {area.name || 'Unknown Area'}
                  </h3>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '10px',
                  marginBottom: '15px'
                }}>
                  <div style={{background: 'rgba(255,255,255,0.2)',padding: '10px',borderRadius: '8px',textAlign: 'center'}}>
                    <div style={{fontSize: '20px', fontWeight: 'bold'}}>{areaRooms.length}</div>
                    <div style={{fontSize: '12px', opacity: 0.9}}>Rooms</div>
                  </div>
                  <div style={{background: 'rgba(255,255,255,0.2)',padding: '10px',borderRadius: '8px',textAlign: 'center'}}>
                    <div style={{fontSize: '20px', fontWeight: 'bold'}}>{areaSensors.length}</div>
                    <div style={{fontSize: '12px', opacity: 0.9}}>Sensors</div>
                  </div>
                  <div style={{background: 'rgba(255,255,255,0.2)',padding: '10px',borderRadius: '8px',textAlign: 'center'}}>
                    <div style={{fontSize: '20px', fontWeight: 'bold'}}>
                      {areaSensors.filter(s => s.status === 'available').length}
                    </div>
                    <div style={{fontSize: '12px', opacity: 0.9}}>Available</div>
                  </div>
                </div>

                {/* Rooms list */}
                <div style={{marginBottom: '10px'}}>
                  <strong style={{fontSize: '14px'}}>🏠 Rooms:</strong>
                  <div style={{marginTop: '8px',display: 'flex',flexWrap: 'wrap',gap: '5px'}}>
                    {areaRooms.map(room => (
                        <span key={`${room.id}-${room.room_name}`}  // ← Unique

                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          border: '1px solid rgba(255,255,255,0.3)'
                        }}
                      >
                        {room.room_name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Sensors list */}
                <div>
                  <strong style={{fontSize: '14px'}}>📡 Sensors:</strong>
                  <div style={{marginTop: '8px',display: 'flex',flexWrap: 'wrap',gap: '5px'}}>
                    {areaSensors.map(sensor => (
                      <span
                        key={sensor.id}  
                        style={{
                          background: sensor.status === 'available' ? 'rgba(76, 175, 80, 0.8)'
                                   : sensor.status === 'occupied'  ? 'rgba(255, 87, 34, 0.8)'
                                   : 'rgba(255, 193, 7, 0.8)',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        title={`${sensor.id} - ${sensor.status}`}
                      >
                        {sensor.id}
                      </span>
                    ))}
                    {areaSensors.length === 0 && (
                      <span style={{color: 'rgba(255,255,255,0.7)',fontSize: '12px',fontStyle: 'italic'}}>
                        No sensors assigned
                      </span>
                    )}
                  </div>
                </div>

                {/* Rooms by Floor */}
                <div style={{marginBottom: '10px'}}>
                  <strong style={{fontSize: '14px'}}>🏠 Rooms by Floor:</strong>
                  <div style={{marginTop: '8px'}}>
                    {[...new Set(areaRooms.map(r => r.floor))].sort((a, b) => (a ?? 0) - (b ?? 0)).map(floor => (
                      <div key={`fl-${area.id ?? area.name}-${String(floor ?? 'NA')}`} style={{marginBottom: '6px'}}>
                        <span style={{fontWeight: 'bold', color: '#ffd700'}}>Floor {floor ?? 'N/A'}:</span>{' '}
                        {areaRooms
                          .filter(room => room.floor === floor)
                          .map(room => (
                            <span
                              key={room.id}  
                              style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                marginRight: '4px'
                              }}
                            >
                              {room.room_name}
                            </span>
                          ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
        })}

        {/* Unassigned Area */}
        {rooms.filter(room => !room.area_name).length > 0 && (() => {
          const unassignedRooms = rooms.filter(room => !room.area_name);
          const unassignedSensors = sensors.filter(sensor =>
            unassignedRooms.some(room => room.id === sensor.room_id)
          );
          return (
            <div
              style={{
                padding: '20px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%)',
                color: 'white',
                boxShadow: '0 6px 12px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{display: 'flex',alignItems: 'center',marginBottom: '15px',borderBottom: '2px solid rgba(255,255,255,0.3)',paddingBottom: '10px'}}>
                <div style={{fontSize: '24px', marginRight: '10px'}}>❓</div>
                <h3 style={{margin: 0, fontSize: '20px', fontWeight: 'bold'}}>Unassigned Area</h3>
              </div>

              <div style={{display: 'grid',gridTemplateColumns: 'repeat(3, 1fr)',gap: '10px',marginBottom: '15px'}}>
                <div style={{background: 'rgba(255,255,255,0.2)',padding: '10px',borderRadius: '8px',textAlign: 'center'}}>
                  <div style={{fontSize: '20px', fontWeight: 'bold'}}>{unassignedRooms.length}</div>
                  <div style={{fontSize: '12px', opacity: 0.9}}>Rooms</div>
                </div>
                <div style={{background: 'rgba(255,255,255,0.2)',padding: '10px',borderRadius: '8px',textAlign: 'center'}}>
                  <div style={{fontSize: '20px', fontWeight: 'bold'}}>{unassignedSensors.length}</div>
                  <div style={{fontSize: '12px', opacity: 0.9}}>Sensors</div>
                </div>
                <div style={{background: 'rgba(255,255,255,0.2)',padding: '10px',borderRadius: '8px',textAlign: 'center'}}>
                  <div style={{fontSize: '20px', fontWeight: 'bold'}}>{unassignedSensors.filter(s => s.status === 'available').length}</div>
                  <div style={{fontSize: '12px', opacity: 0.9}}>Available</div>
                </div>
              </div>

              <div style={{marginBottom: '10px'}}>
                <strong style={{fontSize: '14px'}}>🏠 Rooms:</strong>
                <div style={{marginTop: '8px',display: 'flex',flexWrap: 'wrap',gap: '5px'}}>
                  {unassignedRooms.map(room => (
                    <span
                      key={room.id}
                      style={{
                        background: 'rgba(255,255,255,0.2)',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        border: '1px solid rgba(255,255,255,0.3)'
                      }}
                    >
                      {room.room_name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <strong style={{fontSize: '14px'}}>📡 Sensors:</strong>
                <div style={{marginTop: '8px',display: 'flex',flexWrap: 'wrap',gap: '5px'}}>
                  {unassignedSensors.map(sensor => (
                    <span
                      key={sensor.id}  
                      style={{
                        background: sensor.status === 'available' ? 'rgba(76, 175, 80, 0.8)'
                                 : sensor.status === 'occupied'  ? 'rgba(255, 87, 34, 0.8)'
                                 : 'rgba(255, 193, 7, 0.8)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                      title={`${sensor.id} - ${sensor.status}`}
                    >
                      {sensor.id}
                    </span>
                  ))}
                  {unassignedSensors.length === 0 && (
                    <span style={{color: 'rgba(255,255,255,0.7)',fontSize: '12px',fontStyle: 'italic'}}>
                      No sensors assigned
                    </span>
                  )}
                </div>
              </div>

              <div style={{marginBottom: '10px'}}>
                <strong style={{fontSize: '14px'}}>🏠 Rooms by Floor:</strong>
                <div style={{marginTop: '8px'}}>
                  {[...new Set(unassignedRooms.map(room => room.floor))]
                    .sort((a, b) => (a ?? 0) - (b ?? 0))
                    .map(floor => (
                      <div key={`unassigned-fl-${String(floor ?? 'NA')}`} style={{marginBottom: '6px'}}>
                        <span style={{fontWeight: 'bold', color: '#ffd700'}}>Floor {floor ?? 'N/A'}:</span>{' '}
                        {unassignedRooms
                          .filter(room => room.floor === floor)
                          .map(room => (
                            <span
                              key={room.id}  
                              style={{
                                background: 'rgba(255,255,255,0.2)',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                border: '1px solid rgba(255,255,255,0.3)',
                                marginRight: '4px'
                              }}
                            >
                              {room.room_name}
                            </span>
                          ))}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default AreasOverview;
