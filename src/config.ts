// Vite environment variables
const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5001';

export const config = {
  development: false,
  debug: true,
  appKey: 'crash-0.1.0',
  api: `${API_URL}/api`,
  wss: API_URL,
};
