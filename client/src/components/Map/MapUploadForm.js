import React, { useRef, useState, useEffect } from 'react';
import apiService from '../../services/apiService';

function MapUploadForm({ onSuccess }) {
  const [mapCode, setMapCode] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const [existingCodes, setExistingCodes] = useState([]);

  useEffect(() => {
    // Fetch existing map codes on mount
    (async () => {
      try {
        const res = await apiService.fetchMaps();
        if (res.success && Array.isArray(res.data)) {
          setExistingCodes(res.data.map(m => m.map_code || m).map(c => String(c).toLowerCase()));
        }
      } catch (err) {
        // Ignore fetch errors, just don't validate uniqueness
      }
    })();
  }, []);

  // Dynamic validation for mapCode
  useEffect(() => {
    const code = mapCode.trim();
    if (!code) {
      setCodeError('');
      return;
    }
    if (!/^[A-Za-z0-9]+$/.test(code)) {
      setCodeError('Map code must contain only English letters and numbers.');
      return;
    }
    if (existingCodes.includes(code.toLowerCase())) {
      setCodeError('Map code already exists. Please choose a different code.');
      return;
    }
    setCodeError('');
  }, [mapCode, existingCodes]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(f ? URL.createObjectURL(f) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = mapCode.trim();
    if (!code || !file) {
      setMessage('Please enter a map code and select an image file.');
      return;
    }
    if (codeError) {
      setMessage(codeError);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('mapImage', file, `${code}.jpg`);
      formData.append('map_code', code);

      const res = await fetch('/api/maps/upload', {
        method: 'POST',
        body: formData
      });

      const ct = res.headers.get('content-type') || '';
      const payload = ct.includes('application/json') ? await res.json() : await res.text();

      if (!res.ok) {
        const msg = typeof payload === 'string'
          ? payload
          : (payload?.message || `Upload error (HTTP ${res.status})`);
        throw new Error(msg);
      }

      if (payload?.success) {
        setMessage('Map uploaded successfully!');
        setMapCode('');
        setFile(null);
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        onSuccess?.({
          map_code: (payload?.data?.map_code || code),
          url: payload?.data?.url || null,
          version: Date.now()
        });
      } else {
        setMessage(
          (typeof payload === 'string' && payload) ||
          payload?.message ||
          'Upload error'
        );
      }
    } catch (err) {
      setMessage(err?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e3e9f3 100%)',
        border: '1px solid #dbeafe',
        borderRadius: 18,
        padding: 36,
        margin: '48px auto 0 auto',
        maxWidth: 440,
        boxShadow: '0 6px 32px rgba(30, 64, 175, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 22
      }}
    >
      <h2 style={{
        margin: 0,
        marginBottom: 10,
        fontWeight: 800,
        fontSize: 24,
        color: '#1e293b',
        letterSpacing: 0.7,
        textAlign: 'center'
      }}>
        Upload a New zone
      </h2>
      <p style={{
        color: '#475569',
        fontSize: 15.5,
        margin: 0,
        marginBottom: 12,
        textAlign: 'center'
      }}>
        Choose a map image and assign a unique code for identification.
      </p>

      <div>
        <label style={{ fontWeight: 700, marginBottom: 6, color: '#334155', display: 'block' }}>
          Map Code <span style={{ color: '#2563eb' }}>*</span>
        </label>
        <input
          value={mapCode}
          onChange={(e) => setMapCode(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 14px',
            marginTop: 4,
            borderRadius: 8,
            border: codeError ? '2px solid #dc2626' : '1.5px solid #cbd5e1',
            fontSize: 16,
            background: '#f1f5f9',
            outline: 'none',
            transition: 'border 0.18s',
          }}
          placeholder="Enter unique map code (e.g. zone1)"
        />
        {codeError && (
          <div style={{ color: '#dc2626', fontSize: 14, marginTop: 4, fontWeight: 600 }}>
            {codeError}
          </div>
        )}
      </div>

      <div>
        <label style={{ fontWeight: 700, marginBottom: 6, color: '#334155', display: 'block' }}>
          Image File <span style={{ color: '#2563eb' }}>*</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{
            marginTop: 4,
            fontSize: 15,
            background: '#f1f5f9',
            borderRadius: 8,
            padding: '7px 0'
          }}
        />
      </div>

      {preview && (
        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <img
            src={preview}
            alt="Map preview"
            style={{
              maxWidth: '100%',
              maxHeight: 180,
              borderRadius: 12,
              border: '1.5px solid #cbd5e1',
              boxShadow: '0 2px 12px rgba(30,64,175,0.07)'
            }}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !!codeError}
        style={{
          background: loading
            ? 'linear-gradient(90deg, #93c5fd 0%, #60a5fa 100%)'
            : 'linear-gradient(90deg, #2563eb 0%, #1e40af 100%)',
          color: 'white',
          padding: '13px 0',
          border: 'none',
          borderRadius: 8,
          fontSize: 17,
          fontWeight: 700,
          cursor: loading || !!codeError ? 'not-allowed' : 'pointer',
          marginTop: 10,
          boxShadow: '0 2px 8px rgba(30,64,175,0.06)',
          transition: 'background 0.18s'
        }}
      >
        {loading ? 'Uploading...' : 'Upload Map'}
      </button>

      <div
        style={{
          color: message.toLowerCase().includes('success') ? '#059669' : '#dc2626',
          marginTop: 2,
          minHeight: 24,
          fontWeight: 600,
          textAlign: 'center',
          fontSize: 15.5
        }}
      >
        {message}
      </div>
    </form>
  );
}

export default MapUploadForm;
