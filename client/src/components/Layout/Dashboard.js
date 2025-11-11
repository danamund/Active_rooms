import React, { useEffect, useState } from 'react';
import Header from './Header';
import MapSection from './MapSection';

const Dashboard = ({ user, onLogout }) => {
  const [sensors, setSensors] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showMap, setShowMap] = useState(true);
  // Retrieve the last map_code from localStorage if exists
  const savedMapCode = localStorage.getItem('lastMapCode') || null;
  const [activeMapCode, setActiveMapCode] = useState(savedMapCode);
  const [mapRefresh, setMapRefresh] = useState(0);

  useEffect(() => {
    fetchData();
  }, [user?.credentials?.username, user?.credentials?.password, activeMapCode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setMessage('');

      // Rooms
      const roomsRes = await fetch(`/api/rooms?map_code=${activeMapCode}`);
      const roomsData = await roomsRes.json();
      if (roomsData?.success) setRooms(roomsData.data);
      else throw new Error(roomsData?.message || 'Failed to load rooms');

      // Sensors
      const sensorsRes = await fetch(`/api/sensors?map_code=${activeMapCode}`, {
        headers: {
          'username': user?.credentials?.username || '',
          'password': user?.credentials?.password || ''
        }
      });
      const sensorsData = await sensorsRes.json();
      if (sensorsData?.success) setSensors(sensorsData.data);
      else throw new Error(sensorsData?.message || 'Failed to load sensors');

      // Areas
      const areasRes = await fetch(`/api/areas?map_code=${activeMapCode}`);
      const areasData = await areasRes.json();
      if (areasData?.success) setAreas(areasData.data);
      else throw new Error(areasData?.message || 'Failed to load areas');

    } catch (error) {
      console.error('Error:', error);
      setMessage(error.message || 'Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = async (roomData) => {
    try {
      setLoading(true);

      const map_code = roomData.map_code || activeMapCode;

      // ✅ Check that map_code is not missing
      if (!map_code || map_code.trim() === '') {
        setMessage('❌ No active map selected – please select a map first');
        return;
      }

      const fullRoomData = {
        ...roomData,
        map_code
      };

      await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'username': user.credentials.username,
          'password': user.credentials.password,
        },
        body: JSON.stringify({
          id, description, room_number, x, y, floor, area_id,
          map_code: selectedMap
        })
      });

      const result = await res.json();
      if (result.success) {
        setRooms(prev => [...prev, result.data]);
        setMessage('✅ Room added successfully');
      } else {
        throw new Error(result.message || 'Error adding room');
      }
    } catch (err) {
      console.error('Error adding room:', err);
      setMessage('❌ Error adding room');
    } finally {
      setLoading(false);
    }
  };

  const handleMapUploaded = ({ map_code, version }) => {
    setRooms([]);
    setSensors([]);
    setAreas([]);
    setActiveMapCode(map_code);
    setMapRefresh(version || Date.now());
    setMessage('✓ New map loaded. Data reset according to new map_code.');

    // ✅ Save the last map code
    localStorage.setItem('lastMapCode', map_code);
  };

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(''), 3000);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div className="dashboard">
      <Header user={user} onLogout={onLogout} />

      <main className="dashboard-main" style={{ padding: 16 }}>
        {message && (
          <div className="alert alert-info" style={{ marginBottom: 12 }}>
            {message}
          </div>
        )}
        {loading && <div className="loading">Loading…</div>}

        <MapSection
          showMap={showMap}
          onToggleMap={handleToggleMap}
          sensors={sensors}
          rooms={rooms}
          areas={areas}
          onSensorClick={handleSensorClick}
          onMapClick={handleMapClick}
          onAddRoomFromMap={handleAddRoom}
          user={user}
          mapCode={activeMapCode}
          onMapUploaded={handleMapUploaded}
        />
        
      </main>
    </div>
  );
};

export default Dashboard;
