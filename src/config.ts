// Fallback URL if environment variable is not loaded
const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

export const config = {
  development: false,
  debug: true,
  appKey: "crash-0.1.0",
  api: `${API_URL}/api`,
  wss: API_URL,
};
