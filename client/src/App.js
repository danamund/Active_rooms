import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Auth/Login';
import AddSensorModel from './components/Modals/AddSensorModel';
import EditSensorModel from './components/Modals/EditSensorModel';
import AreasOverview from './components/AreaOverview/AreasOverview';
import StatsCards from './components/Stats/StatsCards';
import RoomsSection from './components/Rooms/RoomsSection';
import Header from './components/Layout/Header';
import SensorsSection from './components/Sensors/SensorsSection';
import MessageBanner from './components/Common/MessageBanner';
import MapToggleButton from './components/Common/MapToggleButton';
import MapSection from './components/Map/MapSection';
import apiService from './services/apiService';
import AddRoomModel from './components/Modals/AddRoomModel';
import EditRoomModel from './components/Modals/EditRoomModel';
import MapsBar from './components/Map/MapsBar';

// Enhanced Dashboard Component with Admin Features
const Dashboard = ({ user, onLogout }) => {
  // Area add handler
  // Function for picking a map
  const handlePickMap = (code) => {
    if (!code) return;
    setSelectedMap(code);
    sessionStorage.setItem('activeRoomsSelectedMap', code); // Save for refresh
  };
  const handleAddArea = async (areaData) => {
    setLoading(true);
    try {
      const payload = { ...areaData, map_code: selectedMap }; // <<< Important!
      const res = await apiService.addArea(user, payload);
      if (res.success) {
        setMessage('Area added successfully!');
        fetchData();
        return { success: true };
      } else {
        setMessage(res.message || 'Error adding area');
        return { success: false, errors: res.errors || [res.message || 'Error adding area'] };
      }
    } catch (err) {
      setMessage('Error adding area');
      return { success: false, errors: ['Error adding area'] };
    } finally {
      setLoading(false);
    }
  };
  // Edit Area handler
  const handleEditArea = async (updatedArea) => {
    setLoading(true);
    try {
      console.log('[App.js] handleEditArea called with:', updatedArea);
      if (!updatedArea.id) {
        setMessage('Error: Area ID is missing!');
        return { success: false, errors: ['Area ID is missing'] };
      }
      const res = await apiService.updateArea(user, updatedArea.id, {
        name: updatedArea.name,
        description: updatedArea.description
      });
      console.log('[App.js] updateArea response:', res);
      if (res.success) {
        setMessage('Area updated successfully!');
        setAreas(prevAreas => prevAreas.map(a => a.id === updatedArea.id ? { ...a, ...res.data } : a));
        fetchData();
        return { success: true };
      } else {
        setMessage(res.message || 'Error updating area');
        return { success: false, errors: res.errors || [res.message || 'Error updating area'] };
      }
    } catch (err) {
      setMessage('Error updating area');
      return { success: false, errors: ['Error updating area'] };
    } finally {
      setLoading(false);
    }
  };
  const [sensors, setSensors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [areas, setAreas] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddRoomModel, setShowAddRoomModel] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedSensor, setSelectedSensor] = useState(null);
  const [showMap, setShowMap] = useState(true);
  const [editSensor, setEditSensor] = useState(null);
  const [editRoom, setEditRoom] = useState(null);
  const [allowedBounds, setAllowedBounds] = useState({
    xMin: 0,
    xMax: 800,
    yMin: 0,
    yMax: 600,
  });
  const [addSensorXY, setAddSensorXY] = useState(null);
  const [addRoomXY, setAddRoomXY] = useState(null);
  const [maps, setMaps] = useState([]);            // List of map_code
  const [selectedMap, setSelectedMap] = useState(''); // Selected map
  const [zones, setZones] = useState([]);          // Zones of the map

  const getFullRoomLabel = (roomId) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return 'N/A';
    return `${room.room_name} (${room.area || 'Unknown'})`;
  };

  const handleDeleteMap = async (code) => {
    if (!code) return;
    if (!window.confirm(`Delete map "${code}"? This may remove its rooms, areas, sensors and the map image.`)) return;

    // Try to delete without force (want a warning if there are dependencies)
    const res = await apiService.deleteMap(code, { force: false });
    if (res?.success) {
      setMessage(`Map "${code}" deleted`);
    } else if (res && res.deps) {
      // There are dependencies — show double confirmation
      const { rooms = 0, areas = 0, sensors = 0, zones = 0 } = res.deps;
      const ok = window.confirm(
        `This map has dependencies:\nRooms: ${rooms}\nAreas: ${areas}\nSensors: ${sensors}\nZones: ${zones}\n\nDelete anyway?`
      );
      if (!ok) return;

      const res2 = await apiService.deleteMap(code, { force: true });
      if (!res2?.success) {
        setMessage(res2?.message || 'Failed to delete map');
        return;
      }
      setMessage(`Map "${code}" deleted with dependencies`);
    } else {
      setMessage(res?.message || 'Failed to delete map');
      return;
    }

    // Update client state
    setMaps(prev => prev.filter(c => c !== code));
    if (selectedMap === code) {
      const next = (maps.includes('HIT') ? 'HIT' : (maps.find(c => c !== code) || ''));
      setSelectedMap(next);
      sessionStorage.setItem('activeRoomsSelectedMap', next);
    }

    // Refresh data (will fetch lists for the new active map)
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [user, selectedMap]);

  // 1) On initial session restore
  useEffect(() => {
    const saved = sessionStorage.getItem('activeRoomsSelectedMap');
    if (saved) setSelectedMap(saved);
    // Remove old key if you previously used localStorage for the map
    localStorage.removeItem('activeRoomsSelectedMap');
  }, []);

  // 2) On every map change - save to session (will persist after refresh)
  useEffect(() => {
    if (selectedMap) {
      sessionStorage.setItem('activeRoomsSelectedMap', selectedMap);
    }
  }, [selectedMap]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // --- 1) Load maps first ---
      const mapsRes = await apiService.fetchMaps();
      let activeMap = selectedMap;

      if (mapsRes.success) {
        const mapCodes = (mapsRes.data || []).map(m => m.map_code || m);
        setMaps(Array.from(new Set(mapCodes)));

        // Try first what was saved in session
        const saved = sessionStorage.getItem('activeRoomsSelectedMap');

        if (saved && mapCodes.includes(saved)) {
          activeMap = saved;
        } else if (!activeMap) {
          // If no selectedMap - pick HIT if exists, otherwise the first
          activeMap = mapCodes.includes('HIT') ? 'HIT' : (mapCodes[0] || '');
        } else if (!mapCodes.includes(activeMap)) {
          // If current selectedMap no longer exists - fallback to HIT/first
          activeMap = mapCodes.includes('HIT') ? 'HIT' : (mapCodes[0] || '');
        }

        // Update selectedMap only if changed, to avoid unnecessary loops
        if (activeMap && activeMap !== selectedMap) {
          setSelectedMap(activeMap);
        }
      }

      // No maps at all
      if (!activeMap) {
        setRooms([]); setSensors([]); setAreas([]); setZones([]);
        return;
      }

      // --- 2) Now load the data for the active map ---
      const [roomsData, sensorsData, areasData, zonesData] = await Promise.all([
        apiService.fetchRooms(activeMap),
        apiService.fetchSensors(user, activeMap),
        apiService.fetchAreas(activeMap),
        apiService.fetchZones(activeMap),
      ]);

      if (roomsData.success)   setRooms(roomsData.data);
      if (sensorsData.success) setSensors(sensorsData.data);
      if (areasData.success)   setAreas(areasData.data);
      if (zonesData.success)   setZones(zonesData.data);

    } catch (error) {
      console.error('Error:', error);
      setMessage('Error loading data');
    } finally {
      setLoading(false);
    }
  };


  const handleAddSensor = async (sensorData) => {
    try {
      setLoading(true);
      console.log("🛰️ Sending sensor:", sensorData);

      const data = await apiService.addSensor(user, sensorData);
      if (data.success) {
        setMessage(`✅ Sensor ${sensorData.id} added successfully!`);
        setShowAddModal(false);
        fetchData(); // Refresh data
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error adding sensor:', error);
      setMessage('❌ Error adding sensor');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSensor = async (sensorData) => {
    try {
      setLoading(true);
      const data = await apiService.updateSensor(user, sensorData);
      if (data.success) {
        setMessage(`✅ Sensor ${sensorData.id} updated successfully!`);
        setEditSensor(null);
        // fetchData refreshes all sensors (and rooms) from the server
        fetchData();
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Error updating sensor');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSensor = async (sensorId) => {
    if (!window.confirm(`Are you sure you want to delete sensor ${sensorId}?`)) {
      return;
    }

    try {
      setLoading(true);
      const data = await apiService.deleteSensor(user, sensorId);
      if (data.success) {
        setMessage(`✅ Sensor ${sensorId} deleted successfully!`);
        fetchData(); // Refresh data
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error deleting sensor:', error);
      setMessage('❌ Error deleting sensor');
    } finally {
      setLoading(false);
    }
  };

  // --- Add Room handler ---
  const handleAddRoom = async (roomData) => {
    try {
      setLoading(true);
      const data = await apiService.addRoom(user, roomData);
      if (data.success) {
        setMessage(`✅ Room added successfully!`);
        setShowAddRoomModel(false);
        // Update the room list immediately (without fetchData)
        setRooms(prevRooms => {
          // If the room already exists (e.g. update), update it, otherwise add
          if (prevRooms.some(r => r.id === data.data.id)) {
            return prevRooms.map(r => r.id === data.data.id ? data.data : r);
          }
          return [...prevRooms, data.data];
        });
      } else {
        setMessage(`❌ Error: ${data.message || (data.errors && data.errors.join(', '))}`);
      }
    } catch (error) {
      setMessage('❌ Error adding room');
    } finally {
      setLoading(false);
    }
  };

  // --- Update Room handler ---
  const handleUpdateRoom = async (roomId, roomData) => {
    setLoading(true);
    try {
      const data = await apiService.updateRoom(user, roomId, roomData);
      if (data.success) {
        setMessage(`✅ Room updated successfully!`);
        setEditRoom(null);
        // Make sure fetchData finishes before closing the modal
        await fetchData();
      } else {
        setMessage(`❌ Error: ${data.message || (data.errors && data.errors.join(', '))}`);
      }
    } catch (error) {
      setMessage('❌ Error updating room');
    } finally {
      setLoading(false);
    }
  };

  // --- Delete Room handler ---
  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm(`Are you sure you want to delete room ${roomId}? Sensors (if exist) will remain without a room.`)) {
      return;
    }
    try {
      setLoading(true);
      const data = await apiService.deleteRoom(user, roomId);
      if (data.success) {
        setMessage(`✅ Room ${roomId} deleted successfully!`);
        // Remove the room from the list immediately (without fetchData)
        setRooms(prevRooms => prevRooms.filter(r => r.id !== roomId));
      } else {
        setMessage(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      setMessage('❌ Error deleting room');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArea = async (areaId) => {
    if (!window.confirm('Are you sure you want to delete this area?')) return;
    setLoading(true);
    try {
      const res = await apiService.deleteArea(user, areaId);
      if (res.success) {
        setMessage('Area deleted successfully!');
        fetchData();
      } else {
        setMessage(res.message || 'Error deleting area');
      }
    } catch (err) {
      setMessage('Error deleting area');
    } finally {
      setLoading(false);
    }
  };
  // Sets the new map as the active map and saves to localStorage
  const handleMapUploaded = (newMapCode) => {
    if (!newMapCode) return;
    setSelectedMap(newMapCode);
    sessionStorage.setItem('activeRoomsSelectedMap', newMapCode);// Optionally: refresh data for this map immediately
  };

  // Auto-hide message after 3 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Add function to handle sensor click on the map
  const handleSensorClick = (sensor) => {
    setSelectedSensor(sensor);
    setMessage(`📡 Selected sensor: ${sensor.id} - Status: ${sensor.status} - Room: ${sensor.room_id || 'N/A'}`);
  };

  const handleEditSensor = (sensor) => {
    setEditSensor(sensor);
    setShowEditModal(true);
  };
  // // Inside MapSection (or wherever the upload actually happens)
  // async function handleUploadMap(file) {
  //   const res = await apiService.uploadMap(file); // POST /api/maps/upload
  //   if (res?.success && res?.data?.map_code) {
  //     // Now is the time to set the new map as active:
  //     props.onMapUploaded?.(res.data.map_code);
  //   } else {
  //     // Error handling...
  //   }
  // }

  return (
    <div>
      <Header user={user} onLogout={onLogout} />

      {/* Main layout: left side (all content), right side (map) */}
      <div
        style={{
          display: 'flex',
          gap: '24px',
          padding: '24px',
          minHeight: 'calc(100vh - 80px)',
          alignItems: 'flex-start',
          direction: 'ltr',
        }}
      >
        {/* Left side: all content except the map */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            paddingLeft: '6px',
            paddingRight: '6px',
            boxSizing: 'border-box',
            fontSize: '0.93em',
            maxWidth: showMap ? 'calc(100vw - 940px)' : '100%',
            transition: 'max-width 0.3s',
          }}
        >
          <MapToggleButton showMap={showMap} onShow={() => setShowMap(true)} />
          <MessageBanner message={message} />
          <StatsCards sensors={sensors} rooms={rooms} />
          <AreasOverview
            rooms={rooms}
            sensors={sensors}
            user={user}
            onAddArea={handleAddArea}
            onDeleteArea={handleDeleteArea}
            onEditArea={handleEditArea}
            areas={areas}
            mapCode={selectedMap}
          />
          <SensorsSection
            sensors={sensors}
            user={user}
            onAddSensor={() => setShowAddModal(true)}
            onEditSensor={handleEditSensor}
            onDeleteSensor={handleDeleteSensor}
            getFullRoomLabel={getFullRoomLabel}
          />
          <RoomsSection
            rooms={rooms}
            user={user}
            onAddRoom={() => setShowAddRoomModel(true)}
            onDeleteRoom={handleDeleteRoom}
            openEditModal={setEditRoom}
          />
        </div>

        {/* Right side: map only (show only if showMap is true) */}
        {showMap && (
          <div
            style={{
              width: '100%',
              maxWidth: '900px',
              minWidth: '600px',
              flexShrink: 0,
              position: 'sticky',
              top: '24px',
              height: 'fit-content',
              background: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',      // <— Important: column
              gap: 8,                       // <— Space between bar and map
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              padding: 12                   // <— Some inner padding
            }}
          >
            {/* ⬇️ Map selection bar */}
            <MapsBar
              maps={maps}
              selectedMap={selectedMap}
              onPick={handlePickMap}
              getImageUrl={apiService.getMapImageUrl}
              canDelete={user?.role === 'admin'}         // Only for admin
              onDelete={handleDeleteMap}
            />

            {/* ⬇️ The map itself */}
            <MapSection
              showMap={showMap}
              onToggleMap={() => setShowMap(false)}
              sensors={sensors}
              rooms={rooms}
              onSensorClick={handleSensorClick}
              onMapClick={
                user?.role === 'admin'
                  ? (x, y) => { setAddSensorXY({ x, y }); setShowAddModal(true); }
                  : undefined
              }
              onAddRoomFromMap={
                user?.role === 'admin'
                  ? ({ x, y }) => { setShowAddRoomModel(true); setAddRoomXY({ x, y }); }
                  : undefined
              }
              user={user}
              mapCode={selectedMap}
              onMapUploaded={handleMapUploaded}
            />
          </div>
        )}
      </div>

      {/* Add Sensor Modal */}
      <AddSensorModel
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setAddSensorXY(null);
        }}
        onSave={async (sensorData) => {
          await handleAddSensor(sensorData); // Save to server
          setShowAddModal(false);
          setAddSensorXY(null);
          fetchData(); // Refresh sensors from UI and database
        }}
        rooms={rooms}
        sensors={sensors}
        initialX={addSensorXY?.x}
        initialY={addSensorXY?.y}
        mapCode={selectedMap}
      />

      {/* Edit Sensor Modal */}
      <EditSensorModel
        isOpen={!!editSensor}
        onClose={() => setEditSensor(null)}
        onSave={handleUpdateSensor}
        sensor={editSensor}
        rooms={rooms}
        sensors={sensors}
      />

      {/* --- Add Room Modal --- */}
      <AddRoomModel
        isOpen={showAddRoomModel}
        onClose={() => {
          setShowAddRoomModel(false);
          setAddRoomXY(null);
        }}
        onSave={handleAddRoom}
        user={user}
        areas={areas}
        initialX={addRoomXY?.x}
        initialY={addRoomXY?.y}
        mapCode={selectedMap}
      />

      <EditRoomModel
        open={!!editRoom}
        onClose={() => setEditRoom(null)}
        room={editRoom}
        areas={areas}
        onSave={roomData => handleUpdateRoom(editRoom.id, roomData)}
        user={user}
      />
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('activeRoomsUser');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('activeRoomsUser');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    localStorage.setItem('activeRoomsUser', JSON.stringify(userData));
    setUser(userData);
  };  

  const handleLogout = () => {
    localStorage.removeItem('activeRoomsUser');
    setUser(null);
  };

  if (loading) {
    return <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
      <div>🔄 Loading...</div>
    </div>;
  }
  
  return (
    <div className="App">
      {user ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
}

export default App;