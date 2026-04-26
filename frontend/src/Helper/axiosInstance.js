import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5014/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Attach JWT token from localStorage on every request
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("tt_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("tt_user");
      localStorage.removeItem("tt_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;