/**
 * Client-side CSRF token management utilities
 * Handles fetching and caching CSRF tokens for frontend requests
 */

let cachedToken: string | null = null;
let tokenFetchPromise: Promise<string> | null = null;

/**
 * Fetches a fresh CSRF token from the server
 * Uses caching to avoid multiple simultaneous requests
 */
export async function getCSRFToken(): Promise<string> {
  // Return cached token if available
  if (cachedToken) {
    return cachedToken;
  }

  // Reuse existing fetch promise if already in progress
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  // Fetch new token
  tokenFetchPromise = fetch("/api/auth/csrf", {
    method: "GET",
    credentials: "include",
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }
      const data = await response.json();
      cachedToken = data.token;
      tokenFetchPromise = null;
      return cachedToken as string;
    })
    .catch((error) => {
      tokenFetchPromise = null;
      throw error;
    });

  return tokenFetchPromise;
}

/**
 * Enhanced fetch wrapper that automatically includes CSRF tokens
 * for state-changing requests (POST, PUT, PATCH, DELETE)
 * 
 * @param url - The URL to fetch
 * @param options - Standard fetch options
 * @returns Promise<Response>
 * 
 * @example
 * const response = await fetchWithCSRF('/api/processes', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * });
 */
export async function fetchWithCSRF(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = (options.method || "GET").toUpperCase();
  
  // Only fetch CSRF token for state-changing methods
  const requiresCSRF = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  
  if (requiresCSRF) {
    const token = await getCSRFToken();
    
    // Add CSRF token to headers
    const headers = new Headers(options.headers);
    headers.set("X-CSRF-Token", token);
    headers.set("Content-Type", headers.get("Content-Type") || "application/json");
    
    options.headers = headers;
  }

  // Ensure credentials are included for cookies
  options.credentials = options.credentials || "include";

  return fetch(url, options);
}

/**
 * Clears the cached CSRF token
 * Useful after logout or when token becomes invalid
 */
export function clearCSRFToken(): void {
  cachedToken = null;
  tokenFetchPromise = null;
}
