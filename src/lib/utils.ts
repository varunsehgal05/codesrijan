import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const rawApi = (import.meta.env.VITE_API_URL ? (import.meta.env.VITE_API_URL.endsWith('/api') ? import.meta.env.VITE_API_URL : import.meta.env.VITE_API_URL + '/api') : 'https://codesrijan-api-6tfr.onrender.com/api');
export const API_BASE = rawApi.endsWith('/api') ? rawApi : `${rawApi}/api`;

export function getAuthHeaders() {
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem("codesrijan_auth_token") : null;
  return (token && token.trim() && token !== 'null' && token !== 'undefined')
    ? { headers: { Authorization: `Bearer ${token.trim()}` } }
    : {};
}

// Global Axios Request Interceptor to ensure Authorization header is always attached
axios.interceptors.request.use((config) => {
  if (typeof localStorage !== 'undefined') {
    const rawToken = localStorage.getItem("codesrijan_auth_token");
    const token = (rawToken && rawToken.trim() && rawToken !== 'null' && rawToken !== 'undefined') ? rawToken.trim() : null;
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});
