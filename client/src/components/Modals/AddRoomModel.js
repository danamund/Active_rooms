import React, { useState, useEffect, useMemo } from 'react';

const AddRoomModel = ({ isOpen, onClose, onSave, areas = [], initialX, initialY, mapCode }) => {
  const [form, setForm] = useState({
    id: '',
    description: '',
    room_number: '',
    x: initialX || '',
    y: initialY || '',
    floor: '',
    area_id: '',
    map_code: mapCode || ''
  });
  const [errors, setErrors] = useState([]);
  const [idError, setIdError] = useState('');

  // Filter areas by the active map (case-insensitive)
  const filteredAreas = useMemo(() => {
    const code = (mapCode || '').toUpperCase();
    return (areas || []).filter(a => (a?.map_code || '').toUpperCase() === code);
  }, [areas, mapCode]);

  // On every modal open – initialize form with current map/coordinates
  useEffect(() => {
    if (!isOpen) return;
    setForm({
      id: '',
      description: '',
      room_number: '',
      x: initialX || '',
      y: initialY || '',
      floor: '',
      area_id: '',
      map_code: mapCode || ''
    });
    setErrors([]);
  }, [isOpen, initialX, initialY, mapCode]);

  // If map changes while modal is open – update map_code and clear area selection
  useEffect(() => {
    if (!isOpen) return;
    setForm(prev => ({ ...prev, map_code: mapCode || '', area_id: '' }));
  }, [mapCode, isOpen]);

  // Async validation for Room ID
  const validateRoomId = async (id) => {
    if (!id) {
      setIdError('Room ID is required');
      return false;
    }
    if (!/^\d{4}$/.test(id)) {
      setIdError('Room ID must be 4 digits (e.g. 1001)');
      return false;
    }
    // Check uniqueness with backend
    try {
      const res = await fetch(`/api/rooms/check-id?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.exists) {
        setIdError('Room ID already exists in the database.');
        return false;
      }
    } catch (err) {
      setIdError('Error checking Room ID. Please try again.');
      return false;
    }
    setIdError('');
    return true;
  };

  const validate = async () => {
    const errs = [];
    const idValid = await validateRoomId(form.id);
    if (!idValid) errs.push(idError || 'Room ID must be 4 digits (e.g. 1001)');
    if (!form.description || form.description.length < 2) errs.push('Description is required');
    if (!form.room_number) errs.push('Room number is required');
    if (form.x === '' || isNaN(form.x)) errs.push('X coordinate is required');
    if (form.y === '' || isNaN(form.y)) errs.push('Y coordinate is required');
    if (!form.map_code || form.map_code.trim() === '')
      errs.push('Missing map_code. Please select or upload a map before adding a room.');
    return errs;
  };

  const handleChange = async (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (e.target.name === 'id') {
      await validateRoomId(e.target.value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = await validate();
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);

    try {
      await onSave({
        id: form.id,
        description: form.description,
        room_number: form.room_number,
        x: Number(form.x),
        y: Number(form.y),
        floor: form.floor || null,
        area_id: form.area_id || null,
        map_code: mapCode || form.map_code || null
      });
    } catch (err) {
      // Try to extract server validation errors
      if (err && err.errors) {
        setErrors(err.errors);
      } else if (err && err.message) {
        setErrors([err.message]);
      } else {
        setErrors(['Unknown error occurred']);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.5)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', zIndex: 1000
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'white', padding: '25px', borderRadius: '12px',
          maxWidth: '450px', width: '90%', boxShadow: '0 2px 12px rgba(0,0,0,0.13)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 20px 0', color: '#333', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 28 }}>➕</span> Add New Room
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Server-side errors */}
          {errors && errors.length > 0 && (
            <div style={{ color: '#f44336', marginBottom: 10 }}>
              {errors.map((err, idx) => (
                <div key={idx}>{err}</div>
              ))}
            </div>
          )}
          {/* Room ID */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Room ID: <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              name="id"
              value={form.id}
              onChange={handleChange}
              required
              maxLength={4}
              style={{
                width: '100%', padding: '8px 12px',
                border: `2px solid ${idError ? '#f44336' : '#ddd'}`,
                borderRadius: '6px', fontSize: '14px'
              }}
            />
            {idError && <small style={{ color: '#f44336' }}>{idError}</small>}
          </div>

          {/* Description */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description: <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              maxLength={255}
              style={{
                width: '100%', padding: '8px 12px',
                border: `2px solid ${errors.find(e => e.toLowerCase().includes('description')) ? '#f44336' : '#ddd'}`,
                borderRadius: '6px', fontSize: '14px'
              }}
            />
          </div>

          {/* Room Number */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Room Number: <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              name="room_number"
              value={form.room_number}
              onChange={handleChange}
              required
              type="number"
              style={{
                width: '100%', padding: '8px 12px',
                border: `2px solid ${errors.find(e => e.toLowerCase().includes('room number')) ? '#f44336' : '#ddd'}`,
                borderRadius: '6px', fontSize: '14px'
              }}
            />
          </div>

          {/* X */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              X: <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              name="x"
              value={form.x}
              onChange={handleChange}
              required
              type="number"
              min={0}
              max={800}
              style={{ width: '100%', padding: '8px 12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>

          {/* Y */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Y: <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              name="y"
              value={form.y}
              onChange={handleChange}
              required
              type="number"
              min={0}
              max={600}
              style={{ width: '100%', padding: '8px 12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>

          {/* Floor */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Floor:
            </label>
            <input
              name="floor"
              value={form.floor}
              onChange={handleChange}
              type="number"
              min={0}
              max={100}
              style={{ width: '100%', padding: '8px 12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>

          {/* Area (filtered by map) */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Area (optional):
            </label>
            <select
              name="area_id"
              value={form.area_id ?? ''}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px 12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            >
              {/* <option value="">
                {/* Always available: No Area */}
               <option value="">— No Area —</option>
              {filteredAreas.map(area => (
                <option key={area.id} value={area.id}>{area.name}</option>
              ))}
            </select>
          </div>

          {/* Errors */}
          {errors.length > 0 && (
            <div style={{ color: '#f44336', margin: '8px 0', fontSize: '13px' }}>
              {errors.map((err, i) => <div key={i}>{err}</div>)}
            </div>
          )}

          {/* Helper */}
          <div style={{ background:'#f0f8ff', padding:'10px', borderRadius:'6px', marginBottom:'20px', fontSize:'12px', color:'#666' }}>
            💡 <strong>Tip:</strong> Map coordinates: X (0-800), Y (0-600). Top-left is (0,0), bottom-right is (800,600).
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose}
              style={{ flex:1, padding:'10px', background:'#f44336', color:'white', border:'none', borderRadius:'6px', cursor:'pointer' }}>
              Cancel
            </button>
            <button type="submit"
              style={{ flex:1, padding:'10px', background:'#4CAF50', color:'white', border:'none', borderRadius:'6px', fontWeight:'bold', fontSize:15, cursor:'pointer', boxShadow:'0 1px 4px rgba(0,0,0,0.07)' }}>
              ➕ Add Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoomModel;
