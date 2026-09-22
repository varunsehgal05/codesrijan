import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const rawApi = import.meta.env['VITE_API_URL'] || 'https://codesrijan-api.onrender.com/api';
export const API_BASE = rawApi.endsWith('/api') ? rawApi : `${rawApi}/api`;
