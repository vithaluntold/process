/**
 * Centralized API Client for EPI-Q Platform
 * Enterprise-grade HTTP client with automatic CSRF protection,
 * error handling, and token management
 */

import { getCSRFToken, clearCSRFToken } from "./csrf-client";

export interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: any;
  csrf?: boolean;
  skipContentType?: boolean;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Core request method with CSRF protection and error handling
   */
  async request<T = any>(
    url: string,
    options: ApiRequestOptions = {}
  ): Promise<Response> {
    const {
      method = "GET",
      body,
      csrf = true,
      skipContentType = false,
      headers = {},
      ...restOptions
    } = options;

    const requestMethod = method.toUpperCase();
    const requiresCSRF =
      csrf && ["POST", "PUT", "PATCH", "DELETE"].includes(requestMethod);

    // Build headers
    const requestHeaders = new Headers(headers);

    // Add CSRF token for state-changing methods
    if (requiresCSRF) {
      try {
        const token = await getCSRFToken();
        requestHeaders.set("X-CSRF-Token", token);
      } catch (error) {
        console.error("Failed to fetch CSRF token:", error);
        throw new Error("Security token unavailable. Please refresh the page.");
      }
    }

    // Handle body and Content-Type
    let requestBody: any = body;

    if (body !== undefined && body !== null) {
      // FormData: Let browser set Content-Type with boundary
      if (body instanceof FormData) {
        requestBody = body;
        // Don't set Content-Type - browser handles it
      }
      // JSON: Stringify and set Content-Type
      else if (typeof body === "object") {
        requestBody = JSON.stringify(body);
        if (!skipContentType && !requestHeaders.has("Content-Type")) {
          requestHeaders.set("Content-Type", "application/json");
        }
      }
      // String/other: Pass through
      else {
        requestBody = body;
      }
    }

    // Make request
    const response = await fetch(`${this.baseUrl}${url}`, {
      method: requestMethod,
      headers: requestHeaders,
      body: requestBody,
      credentials: "include",
      ...restOptions,
    });

    // Handle 403 CSRF errors with token refresh
    // NOTE: Do NOT retry FormData uploads as the body stream is consumed
    // For FormData, return the 403 and let user retry manually
    if (response.status === 403 && requiresCSRF && !(body instanceof FormData)) {
      try {
        const errorData = await response.clone().json();
        if (
          errorData.error?.includes("CSRF") ||
          errorData.error?.includes("token")
        ) {
          // Clear cached token and retry once
          clearCSRFToken();
          const newToken = await getCSRFToken();
          requestHeaders.set("X-CSRF-Token", newToken);

          // Reconstruct body for retry (JSON only)
          let retryBody = requestBody;
          if (body !== undefined && body !== null && typeof body === "object") {
            retryBody = JSON.stringify(body);
          }

          return fetch(`${this.baseUrl}${url}`, {
            method: requestMethod,
            headers: requestHeaders,
            body: retryBody,
            credentials: "include",
            ...restOptions,
          });
        }
      } catch {
        // If parsing fails, return original response
      }
    }

    return response;
  }

  /**
   * Convenience method: GET request
   */
  async get<T = any>(
    url: string,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ): Promise<Response> {
    return this.request<T>(url, { ...options, method: "GET" });
  }

  /**
   * Convenience method: POST request with CSRF
   */
  async post<T = any>(
    url: string,
    body?: any,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ): Promise<Response> {
    return this.request<T>(url, { ...options, method: "POST", body });
  }

  /**
   * Convenience method: PUT request with CSRF
   */
  async put<T = any>(
    url: string,
    body?: any,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ): Promise<Response> {
    return this.request<T>(url, { ...options, method: "PUT", body });
  }

  /**
   * Convenience method: PATCH request with CSRF
   */
  async patch<T = any>(
    url: string,
    body?: any,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ): Promise<Response> {
    return this.request<T>(url, { ...options, method: "PATCH", body });
  }

  /**
   * Convenience method: DELETE request with CSRF
   */
  async delete<T = any>(
    url: string,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ): Promise<Response> {
    return this.request<T>(url, { ...options, method: "DELETE" });
  }

  /**
   * Upload file with FormData (auto-detects Content-Type)
   */
  async upload<T = any>(url: string, formData: FormData): Promise<Response> {
    return this.request<T>(url, {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Logout and clear CSRF token cache
   */
  async logout(): Promise<void> {
    try {
      await this.post("/api/auth/logout");
    } finally {
      clearCSRFToken();
    }
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export for testing/custom instances
export { ApiClient };
