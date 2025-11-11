import React, { useState } from 'react';

const AddSensorDialog = ({ position, rooms, onAdd, onCancel }) => {
  const [form, setForm] = useState({
    id: '',
    status: 'available',
    room_id: rooms?.[0]?.id || '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd({ ...form, x: position.x, y: position.y });
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        background: 'white',
        border: '1px solid #ccc',
        padding: 16,
        zIndex: 100,
      }}
      onClick={e => e.stopPropagation()} // Prevent map click when clicking dialog
    >
      <form onSubmit={handleSubmit}>
        <div>
          <label>Sensor ID:</label>
          <input name="id" value={form.id} onChange={handleChange} required />
        </div>
        <div>
          <label>Status:</label>
          <select name="status" value={form.status} onChange={handleChange}>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="error">Error</option>
          </select>
        </div>
        <div>
          <label>Room:</label>
          <select name="room_id" value={form.room_id} onChange={handleChange}>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>{room.room_name}</option>
            ))}
          </select>
        </div>
        <button type="submit">Add</button>
        <button type="button" onClick={onCancel}>Cancel</button>
      </form>
    </div>
  );
};

export default AddSensorDialog;