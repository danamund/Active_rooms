import React, { useState } from 'react';
import MapUploadForm from './MapUploadForm';

const modalStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.25)',
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const contentStyle = {
  background: '#fff',
  borderRadius: 12,
  padding: 32,
  minWidth: 340,
  boxShadow: '0 4px 32px rgba(0,0,0,0.13)',
  position: 'relative'
};

export default function MapUploadButton({ user, onSuccess }) {
  const [open, setOpen] = useState(false);

  if (user?.role !== 'admin') return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          background: 'linear-gradient(90deg,#2563eb,#1e40af)',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          padding: '9px 18px',
          fontWeight: 700,
          fontSize: 15,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(30,64,175,0.07)',
          transition: 'background 0.18s'
        }}
      >
        Upload New zone
      </button>
      {open && (
        <div style={modalStyle} onClick={() => setOpen(false)}>
          <div style={contentStyle} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute',
                top: 10, right: 10,
                background: 'none',
                border: 'none',
                fontSize: 22,
                cursor: 'pointer'
              }}
              aria-label="Close"
            >×</button>
          
            <MapUploadForm
              onSuccess={data => {
                onSuccess?.(data);
                setOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
