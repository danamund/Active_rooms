import React, { useState, useEffect } from 'react';
import apiService from '../../services/apiService';

// Modal for editing a room's details (admin only)
export default function EditRoomModal({ open, onClose, room, areas, onSave, user }) {
  // Initialize form state only when room is available
  const [form, setForm] = useState({
    room_name: '',
    floor: '',
    area: '',
    x: '',
    y: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Update form state when room changes
  useEffect(() => {
    if (room) {
      setForm({
        room_name: room.room_name ?? '',
        floor: room.floor ?? '',
        area: room.area ?? '',
        x: room.x ?? '',
        y: room.y ?? '',
      });
      setErrors({});
    }
  }, [room, open]);

  // Handle input changes
  const handleChange = e => {
    const { name, value } = e.target;
    // For room_name, allow both string and number
    if (name === 'room_name') {
      setForm(f => ({ ...f, [name]: value }));
    } else if (name === 'x' || name === 'y') {
      setForm(f => ({ ...f, [name]: value }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };

  // Basic validation
  const validate = () => {
    const errs = {};
    // Room name: allow any non-empty value (string or number)
    if (
      form.room_name === undefined ||
      form.room_name === null ||
      (typeof form.room_name === 'string' && form.room_name.toString().trim() === '') ||
      (typeof form.room_name === 'number' && form.room_name.toString().trim() === '')
    ) {
      errs.room_name = 'Room name required';
    }
    // Floor is optional
    // Area is optional
    // X/Y: must be numbers in range
    if (form.x === '' || isNaN(form.x) || Number(form.x) < 0 || Number(form.x) > 800)
      errs.x = 'X must be 0-800';
    if (form.y === '' || isNaN(form.y) || Number(form.y) < 0 || Number(form.y) > 600)
      errs.y = 'Y must be 0-600';
    return errs;
  };

  // Submit handler
  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      if (onSave) {
        // Always treat room_name as string for trim
        let dataToSave = { ...form };
        if (
          dataToSave.room_name !== undefined &&
          dataToSave.room_name !== null &&
          typeof dataToSave.room_name.trim !== 'function'
        ) {
          dataToSave.room_name = String(dataToSave.room_name);
        }
        if (dataToSave.room_name && typeof dataToSave.room_name === 'string') {
          dataToSave.room_name = dataToSave.room_name.trim();
        }
        await onSave(dataToSave);
      }
      onClose();
    } catch (err) {
      setErrors({ api: err.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  // Don't render modal if not open or room is null
  if (!open || !room) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Edit Room</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label>
            Room Name:
            <input
              name="room_name"
              value={form.room_name + ''}
              onChange={handleChange}
                // type="number" // You can enable this if you want to allow only numbers
            />
            {errors.room_name && <span className="modal-error">{errors.room_name}</span>}
          </label>
          <label>
            Floor:
            <input
              name="floor"
              value={form.floor}
              onChange={handleChange}
            />
            {errors.floor && <span className="modal-error">{errors.floor}</span>}
          </label>
          <label>
            Area:
            <select
              name="area"
              value={form.area}
              onChange={handleChange}
            >
              <option value="">No Area</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {errors.area && <span className="modal-error">{errors.area}</span>}
          </label>
          <div className="modal-xy-row">
            <label>
              Y:
              <input
                name="y"
                value={form.y}
                onChange={handleChange}
              />
              {errors.y && <span className="modal-error">{errors.y}</span>}
            </label>
            <label>
              X:
              <input
                name="x"
                value={form.x}
                onChange={handleChange}
              />
              {errors.x && <span className="modal-error">{errors.x}</span>}
            </label>
          </div>
          {errors.api && <div className="modal-error">{errors.api}</div>}
        </form>
        <div className="modal-footer">
          <button
            type="button"
            className="modal-cancel-btn"
            onClick={onClose}
            disabled={saving}
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
            className="modal-save-btn"
            disabled={saving}
            onClick={handleSubmit}
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
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}