import React, { useState, useEffect } from 'react';

export default function EditAreaModal({ isOpen, area, onClose, onSave }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (area) {
      setForm({
        name: area.name ?? '',
        description: area.description ?? ''
      });
      setErrors({});
    }
  }, [area, isOpen]);

  if (!isOpen || !area) return null;

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name || form.name.trim().length < 2)
      errs.name = 'Name is required (2+ chars)';
    if (form.name.length > 100)
      errs.name = 'Name must be up to 100 chars';
    if (form.description && form.description.length > 255)
      errs.description = 'Description must be up to 255 chars';
    return errs;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      if (onSave) {
        const debugArea = { ...area, ...form };
        console.log('[EditAreaModal] onSave called with:', debugArea);
        const result = await onSave(debugArea);
        console.log('[EditAreaModal] onSave result:', result);
        if (result && result.success) {
          onClose();
        } else if (result && result.errors) {
          setErrors({ api: result.errors.join(', ') });
        } else {
          setErrors({ api: 'Update failed' });
        }
      }
    } catch (err) {
      setErrors({ api: err.message || 'Update failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Edit Area</h2>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <label>
            Name:
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              minLength={2}
              maxLength={100}
              required
            />
            {errors.name && <span className="modal-error">{errors.name}</span>}
          </label>
          <label>
            Description:
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              maxLength={255}
            />
            {errors.description && <span className="modal-error">{errors.description}</span>}
          </label>
          {errors.api && <div className="modal-error">{errors.api}</div>}
          <div className="modal-footer">
            <button
              type="submit"
              className="modal-save-btn"
              disabled={saving}
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
          </div>
        </form>
      </div>
    </div>
  );
}