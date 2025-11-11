import React, { useState, useEffect } from 'react';

const AddAreaModel = ({ isOpen, onClose, onSave, serverErrors, mapCode }) => {
  const [form, setForm] = useState({ id: '', name: '', description: '', map_code: mapCode || '' });
  const [error, setError] = useState('');
  const [idError, setIdError] = useState('');

  useEffect(() => {
    setForm(prev => ({ ...prev, map_code: mapCode || '' }));
  }, [mapCode, isOpen]);


  // Async validation for Area ID
  const validateAreaId = async (id) => {
    if (!id) {
      setIdError('Area ID is required');
      return false;
    }
    if (!/^\d{3}$/.test(id)) {
      setIdError('ID must be 3 digits, e.g. 001, 002, ...');
      return false;
    }
    // Check uniqueness with backend
    try {
      const res = await fetch(`/api/areas/check-id?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      if (data.exists) {
        setIdError('Area ID already exists in the database.');
        return false;
      }
    } catch (err) {
      setIdError('Error checking Area ID. Please try again.');
      return false;
    }
    setIdError('');
    return true;
  };

  const handleChange = async e => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    if (e.target.name === 'id') {
      await validateAreaId(e.target.value);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const idValid = await validateAreaId(form.id);
    if (!idValid) return;
    if (!form.name.trim()) {
      setError('Area name is required');
      return;
    }
    onSave({
      ...form,
      map_code: form.map_code || mapCode || null
    });
  };

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
    }} onClick={onClose}>
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '12px',
        maxWidth: '450px',
        width: '90%',
        boxShadow: '0 2px 12px rgba(0,0,0,0.13)'
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', margin: '0 0 20px 0' }}>
          <h3 style={{ color: '#333', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            Add Area <span style={{ fontSize: 28 }}>➕</span>
          </h3>
        </div>
        <form onSubmit={handleSubmit}>
          {/* Area ID */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
               Area ID <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              name="id"
              value={form.id}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px 12px', border: `2px solid ${idError ? '#f44336' : '#ddd'}`, borderRadius: '6px', fontSize: '14px' }}
            />
            {idError && <small style={{ color: '#f44336' }}>{idError}</small>}
          </div>
          {/* Name */}
          <div style={{ marginBottom: '15px' }}></div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Name <span style={{ color: 'red' }}>*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px 12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
              autoFocus
            />
          </div>
          {/* Description */}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Description
            </label>
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px 12px', border: '2px solid #ddd', borderRadius: '6px', fontSize: '14px' }}
            />
          </div>
          {/* Error messages */}
          {error && <div style={{ color: '#f44336', marginBottom: 10 }}>{error}</div>}
          {serverErrors && serverErrors.length > 0 && (
            <div style={{ color: '#f44336', marginBottom: 10 }}>
              {serverErrors.map((err, idx) => (
                <div key={idx}>{err}</div>
              ))}
            </div>
          )}
          {/* Buttons */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '10px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
              }}
            >
              Add Area <span style={{marginLeft: 6, fontSize: 18}}>➕</span>
            </button>
            <button
              type="button"
              onClick={onClose}
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAreaModel;