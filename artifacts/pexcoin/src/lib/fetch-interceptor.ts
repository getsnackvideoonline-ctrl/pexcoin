import { customFetch } from "@workspace/api-client-react/src/custom-fetch";
import { getToken, getAdminToken } from "./auth-utils";

// Intercept customFetch calls to inject the token
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = input.toString();
  const options = init || {};
  const headers = new Headers(options.headers);
  
  if (url.includes('/api/admin')) {
    const adminToken = getAdminToken();
    if (adminToken) {
      headers.set("Authorization", `Bearer ${adminToken}`);
    }
  } else if (!url.includes('/api/auth/login') && !url.includes('/api/auth/register')) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return originalFetch(input, { ...options, headers });
};
