const API_BASE_URL = '/api';

// Create headers for authentication
const createAuthHeaders = (user) => ({
  'Content-Type': 'application/json',
  'username': user.credentials.username,
  'password': user.credentials.password
});

// Safely parse response. If not JSON (e.g., HTML 404), returns text and throws a clear error.
const handleResponse = async (res) => {
  const ct = res.headers.get('content-type') || '';
  const payload = ct.includes('application/json') ? await res.json() : await res.text();
  if (!res.ok) {
    const message = typeof payload === 'string'
      ? payload
      : (payload.message || JSON.stringify(payload));
    throw new Error(`HTTP ${res.status}: ${message}`);
  }
  return payload; // JSON object or string (on 2xx)
};

// Fetch map image by map code
const fetchMapImage = async (mapCode) => {
  const res = await fetch(`/api/maps/${encodeURIComponent(mapCode)}/image`);
  const data = await handleResponse(res);
  return data; // Expects { success: true, url: "..." }
};

const apiService = {
  // --- AREAS ---
  addArea: async (user, areaData) => {
    const response = await fetch(`${API_BASE_URL}/areas`, {
      method: 'POST',
      headers: createAuthHeaders(user),
      body: JSON.stringify(areaData)
    });
    const data = await handleResponse(response);
    return data;
  },

  updateArea: async (user, areaId, areaData) => {
    const response = await fetch(`${API_BASE_URL}/areas/${areaId}`, {
      method: 'PUT',
      headers: createAuthHeaders(user),
      body: JSON.stringify(areaData)
    });
    const data = await handleResponse(response);
    return data;
  },

  deleteArea: async (user, areaId) => {
    const response = await fetch(`${API_BASE_URL}/areas/${areaId}`, {
      method: 'DELETE',
      headers: createAuthHeaders(user)
    });
    const data = await handleResponse(response);
    return data;
  },

  // --- ROOMS ---
  addRoom: async (user, roomData) => {
    const response = await fetch(`${API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: createAuthHeaders(user),
      body: JSON.stringify(roomData)
    });
    const ct = response.headers.get('content-type') || '';
    const payload = ct.includes('application/json') ? await response.json() : await response.text();
    if (!response.ok) {
      // If server returned validation errors, throw them as an object
      if (payload && payload.errors) {
        const err = new Error(payload.message || 'Validation failed');
        err.errors = payload.errors;
        throw err;
      }
      const message = typeof payload === 'string'
        ? payload
        : (payload.message || JSON.stringify(payload));
      throw new Error(`HTTP ${response.status}: ${message}`);
    }
    return payload;
  },

  updateRoom: async (user, roomId, roomData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
        method: 'PUT',
        headers: createAuthHeaders(user),
        body: JSON.stringify(roomData)
      });
      const data = await handleResponse(response);
      return data;
    } catch (err) {
      return { success: false, message: err.message || 'Network error' };
    }
  },

  deleteRoom: async (user, roomId) => {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: 'DELETE',
      headers: createAuthHeaders(user)
    });
    const data = await handleResponse(response);
    return data;
  },

  // --- SENSORS ---
  addSensor: async (user, sensorData) => {
    const response = await fetch(`${API_BASE_URL}/sensors`, {
      method: 'POST',
      headers: createAuthHeaders(user),
      body: JSON.stringify(sensorData)
    });
    const data = await handleResponse(response);
    return data;
  },

  updateSensor: async (user, sensorData) => {
    const response = await fetch(`${API_BASE_URL}/sensors/${sensorData.id}`, {
      method: 'PUT',
      headers: createAuthHeaders(user),
      body: JSON.stringify(sensorData)
    });
    const data = await handleResponse(response);
    return data;
  },

  deleteSensor: async (user, sensorId) => {
    const response = await fetch(`${API_BASE_URL}/sensors/${sensorId}`, {
      method: 'DELETE',
      headers: createAuthHeaders(user)
    });
    const data = await handleResponse(response);
    return data;
  },
  
  getMapImageUrl: async (mapCode) => {
    if (!mapCode) return '';

    // HIT does not return a default image anymore
    if (mapCode === 'HIT') {
      return '';
    }

    // Other maps from the server
    const res = await fetch(`${API_BASE_URL}/maps/${encodeURIComponent(mapCode)}/image`);
    const data = await handleResponse(res);
    return (data && data.url) ? data.url : '';
  },

  // Add/update this function
  deleteMap: async (mapCode, { force = false } = {}) => {
    const res = await fetch(`/api/maps/${encodeURIComponent(mapCode)}?force=${force ? 'true' : 'false'}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    // Do not throw on 409 — return the body as is
    let data = null;
    try {
      data = await res.json();
    } catch (_) {}

    if (res.ok) return data || { success: true };
    if (res.status === 409) {
      // For example: { success:false, message:'Map has dependent records', deps:{...} }
      return data || { success: false, status: 409 };
    }

    // For other statuses — throw a "regular" error
    const message = (data && data.message) || res.statusText || 'Request failed';
    const err = new Error(`HTTP ${res.status}: ${message}`);
    err.status = res.status;
    err.data = data;
    throw err;
  },

  // --- FETCH METHODS ---
  fetchAreas: async (mapCode) => {
    const url = mapCode
      ? `${API_BASE_URL}/areas?map_code=${encodeURIComponent(mapCode)}`
      : `${API_BASE_URL}/areas`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data;
  },

  // --- ROOMS ---
  fetchRooms: async (mapCode) => {
    const url = mapCode
      ? `${API_BASE_URL}/rooms?map_code=${encodeURIComponent(mapCode)}`
      : `${API_BASE_URL}/rooms`;
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data;
  },

  // --- SENSORS ---
  fetchSensors: async (user, mapCode) => {
    const url = mapCode
      ? `${API_BASE_URL}/sensors?map_code=${encodeURIComponent(mapCode)}`
      : `${API_BASE_URL}/sensors`;
    const response = await fetch(url, { headers: createAuthHeaders(user) });
    const data = await handleResponse(response);
    return data;
  },

  // MAPS & ZONES
  fetchMaps: async () => {
    const response = await fetch(`${API_BASE_URL}/maps`);
    const data = await handleResponse(response);
    return data; // { success, data: [map_code, ...] }
  },

  fetchZones: async (mapCode) => {
    const response = await fetch(`${API_BASE_URL}/zones?map=${encodeURIComponent(mapCode)}`);
    const data = await handleResponse(response);
    return data; // { success, data: [...] }
  },

  // Add this function to the object:
  fetchMapImage,

};

export default apiService;