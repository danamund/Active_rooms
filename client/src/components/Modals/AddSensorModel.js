import React, { useState } from 'react';

  const AddSensorModel = ({ isOpen, onClose, onSave, rooms, sensors, mapCode, initialX, initialY }) => {
    const [sensorData, setSensorData] = useState({
      id: '',
      x: initialX || '',
      y: initialY || '',
      room_id: '',
      status: 'available',
      map_code: mapCode || ''
    });
    const [errors, setErrors] = useState({});

    // Function to handle room selection change in Add Sensor modal
    const handleRoomChangeAdd = (e) => {
      const selectedRoomId = e.target.value;
      if (selectedRoomId) {
        // Find the selected room and get its coordinates
        const selectedRoom = rooms.find(room => room.id === selectedRoomId);
        if (selectedRoom && selectedRoom.x !== null && selectedRoom.y !== null) {
          // Update sensor data with room coordinates
          setSensorData({
            ...sensorData,
            room_id: selectedRoomId,
            x: selectedRoom.x,
            y: selectedRoom.y
          });
        } else {
          // Just update room_id if room has no coordinates, keep x/y as is
          setSensorData({ ...sensorData, room_id: selectedRoomId });
        }
      } else {
        // No room selected, keep x/y as is
        setSensorData({ ...sensorData, room_id: '' });
      }
    };



    // Real-time validation for sensor ID (async check with backend) - room_id is NOT required
    const validateSensorId = async (id) => {
      let newErrors = {};
      if (!id) {
        newErrors.id = 'Sensor ID is required';
      } else if (!/^S\d{3}$/.test(id)) {
        newErrors.id = 'ID must be in format S001, S002, ...';
      } else {
        // Check with backend if sensor ID exists
        try {
          const res = await fetch(`/api/sensors/check-id?id=${encodeURIComponent(id)}`);
          const data = await res.json();
          if (data.exists) {
            newErrors.id = 'Sensor ID already exists in the database.';
          }
        } catch (err) {
          newErrors.id = 'Error checking sensor ID. Please try again.';
        }
      }
      setErrors(prev => {
        const updated = { ...prev, ...newErrors };
        if (!updated.id) delete updated.id;
        return updated;
      });
      // Return true only if no error values
      return Object.values(newErrors).filter(Boolean).length === 0;
    };



    const handleSubmit = async (e) => {
      e.preventDefault();
      const isValid = await validateSensorId(sensorData.id);
      let newErrors = {};
      // Validate X
      if (sensorData.x === '' || sensorData.x === undefined || isNaN(Number(sensorData.x))) {
        newErrors.x = 'X coordinate must be a valid number';
      }
      // Validate Y
      if (sensorData.y === '' || sensorData.y === undefined || isNaN(Number(sensorData.y))) {
        newErrors.y = 'Y coordinate must be a valid number';
      }
      // Remove error if value is valid
      if (!newErrors.x) delete newErrors.x;
      if (!newErrors.y) delete newErrors.y;
      setErrors(prev => ({ ...prev, ...newErrors }));
      if (isValid && Object.keys(newErrors).length === 0) {
        // Get coordinates from selected room if room_id is selected
        const selectedRoom = rooms.find(room => room.id === sensorData.room_id);
        let x = selectedRoom ? selectedRoom.x : sensorData.x;
        let y = selectedRoom ? selectedRoom.y : sensorData.y;
        // Convert to number if possible, else null
        x = x === '' || x === undefined ? null : Number(x);
        y = y === '' || y === undefined ? null : Number(y);
        const dataToSend = {
          ...sensorData,
          map_code: sensorData.map_code || mapCode || null,
          x,
          y
        };
        onSave(dataToSend);
        setSensorData({ id: '', x: '', y: '', room_id: '', status: 'available',map_code: mapCode || '' });
        setErrors({});
      }
    };


    // Live validation for sensor ID field (async)
    const handleIdChange = async (e) => {
      const value = e.target.value.toUpperCase();
      setSensorData({ ...sensorData, id: value });
  // If the value is valid, remove the error message immediately
      if (/^S\d{3}$/.test(value)) {
        setErrors(prev => { const updated = { ...prev }; delete updated.id; return updated; });
      }
      await validateSensorId(value);
    };

    const handleClose = () => {
      setSensorData({ id: '', x: '', y: '', room_id: '', status: 'available',map_code: mapCode || '' });
      setErrors({});
      onClose();
    };

    // useEffect to reset form and errors on every open, and update x/y if needed
    React.useEffect(() => {
      if (isOpen) {
        setSensorData({
          id: '',
          x: typeof initialX === 'number' || (typeof initialX === 'string' && initialX !== '') ? initialX : '',
          y: typeof initialY === 'number' || (typeof initialY === 'string' && initialY !== '') ? initialY : '',
          room_id: '',
          status: 'available',
          map_code: mapCode || ''
        });
        setErrors({});
      }
    }, [isOpen, initialX, initialY, mapCode]);

    if (!isOpen) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }} onClick={handleClose}>
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '12px',
          maxWidth: '450px',
          width: '90%'
        }} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>➕ Add New Sensor</h3>
          
          <form onSubmit={handleSubmit}>
            {/* Sensor ID */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Sensor ID: <span style={{ color: 'red' }}>*</span>
              </label>
              <input
                type="text"
                value={sensorData.id}
                onChange={handleIdChange}
                placeholder="S001"
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `2px solid ${errors.id ? '#f44336' : '#ddd'}`,
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />
              {errors.id && <small style={{ color: '#f44336' }}>{errors.id}</small>}
            </div>

            {/* Room Selection */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Room: <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={sensorData.room_id}
                onChange={handleRoomChangeAdd}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">Select Room *</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.room_name} - {room.description}
                    {room.x !== null && room.y !== null ? ` (${room.x}, ${room.y})` : ' (No coords)'}
                    {sensors.some(sensor => sensor.room_id === room.id) ? ' [Occupied]' : ''}
                  </option>
                ))}
              </select>
              {sensorData.room_id && (
                <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                  💡 Coordinates automatically updated from selected room
                </small>
              )}
              {errors.room_id && <span style={{ color: 'red', fontSize: '12px' }}>{errors.room_id}</span>}
            </div>

            {/* Status */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Status:
              </label>
              <select
                value={sensorData.status}
                onChange={(e) => setSensorData({...sensorData, status: e.target.value})}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="error">Error</option>
              </select>
            </div>

            {/* X/Y fields */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>X:</label>
                <input
                  type="number"
                  value={sensorData.x}
                  onChange={e => {
                    setSensorData({ ...sensorData, x: e.target.value });
                    setErrors(prev => ({ ...prev, x: '' }));
                  }}
                  min={0}
                  max={800}
                  placeholder="X"
                  style={{ width: '100%', padding: '8px 12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                />
                {errors.x && errors.x !== '' && <small style={{ color: '#f44336' }}>{errors.x}</small>}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Y:</label>
                <input
                  type="number"
                  value={sensorData.y}
                  onChange={e => {
                    setSensorData({ ...sensorData, y: e.target.value });
                    setErrors(prev => ({ ...prev, y: '' }));
                  }}
                  min={0}
                  max={600}
                  placeholder="Y"
                  style={{ width: '100%', padding: '8px 12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
                />
                {errors.y && errors.y !== '' && <small style={{ color: '#f44336' }}>{errors.y}</small>}
              </div>
            </div>
            {/* Coordinate Helper */}
            <div style={{ 
              background: '#f0f8ff', 
              padding: '10px', 
              borderRadius: '6px', 
              marginBottom: '20px',
              fontSize: '12px',
              color: '#666'
            }}>
              💡 <strong>Tip:</strong> Map coordinates: X (0-800), Y (0-600). 
              Top-left is (0,0), bottom-right is (800,600).
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  flex: 1,
                  padding: '10px',
                  background: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Add Sensor
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };



  export default AddSensorModel;
