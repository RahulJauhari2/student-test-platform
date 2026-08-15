// Dynamic API URL for development & production hosting
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';


export const apiFetch = async (endpoint, options = {}) => {
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('token');
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include',
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, config);

    let data = {};
    const text = await response.text();
    if (text && text.trim().length > 0) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { message: text };
      }
    }

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error.message);
    if (error.message === 'Failed to fetch') {
      throw new Error('Backend server is offline on http://localhost:5000. Please start the server by running "npm run dev" in the server directory.');
    }
    throw error;
  }
};
