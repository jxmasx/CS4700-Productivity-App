const CRA = process.env.REACT_APP_API_BASE;
const VITE = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE;
export const API_BASE = (VITE || CRA || "https://questify.duckdns.org").replace(/\/+$/,"");

export const API_PREFIX = "/api";

export const API = (path) => `${API_BASE}${API_PREFIX}${path}`;