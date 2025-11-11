import React, { useEffect, useState } from 'react';

export default function MapsBar({
  maps = [],            // ["HIT","MAP_2025_09_03", ...]
  selectedMap,          // The active map
  onPick,               // Function that receives code and selects a map
  getImageUrl,          // Function that returns url for image (apiService.getMapImageUrl)
  onDelete,             // Function to delete a map (code => void)
  canDelete,            // Whether to show delete button (e.g. user?.role === 'admin')
}) {
  // fallbackUrl does not return an image for HIT anymore
  const fallbackUrl = (code) => '';

  const [urls, setUrls] = useState({}); // { code: url }

  useEffect(() => {
    let cancel = false;
    (async () => {
      const entries = await Promise.all(
        (maps || []).map(async (code) => {
          const c = String(code || '');
          if (!c) return [c, ''];
          if (c.toUpperCase() === 'HIT') return [c, fallbackUrl(c)];
          try {
            const url = await getImageUrl?.(c);
            return [c, url || ''];
          } catch {
            return [c, ''];
          }
        })
      );
      if (!cancel) setUrls(Object.fromEntries(entries));
    })();
    return () => { cancel = true; };
  }, [maps, getImageUrl]);

  if (!maps || maps.length === 0) return null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 8,
      }}>
        {maps.map((code, idx) => {
          const c = String(code || '');
          const isActive = c === selectedMap;
          const url = urls[c] || fallbackUrl(c);
          const isHIT = c.toUpperCase() === 'HIT';

          // Show card only if there is a preview (url)
          if (!url) return null;

          return (
            <div key={`${c}-${idx}`} style={{ position: 'relative' }}>
              {/* Delete button – not shown for HIT */}
              {canDelete && !isHIT && (
                <button
                  type="button"
                  title="Delete map"
                  onClick={(e) => { e.stopPropagation(); onDelete?.(c); }}
                  style={{
                    position: 'absolute',
                    top: '5px',
                    right: '5px',
                    background: '#0000004d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    zIndex: 2
                  }}
                  aria-label={`Delete map ${c}`}
                >
                  ✕
                </button>
              )}

              {/* Map card */}
              <button
                type="button"
                onClick={() => onPick?.(c)}
                title={c}
                style={{
                  minWidth: 140,
                  border: isActive ? '2px solid #2196f3' : '2px solid #e0e0e0',
                  borderRadius: 10,
                  padding: 8,
                  background: isActive ? '#E3F2FD' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}
              >
                <div
                  style={{
                    width: 120,
                    height: 70,
                    background: '#fafafa',
                    borderRadius: 6,
                    overflow: 'hidden',
                    alignSelf: 'center'
                  }}
                >
                  <img
                    src={url}
                    alt={c}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.currentTarget.src = ''; }}
                  />
                </div>
                <div style={{ marginTop: 8, textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#333' }}>
                  {c}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
