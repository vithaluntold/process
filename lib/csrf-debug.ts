/**
 * CSRF debugging and testing utilities
 * Use these functions to test CSRF functionality in development
 */

import { getCSRFToken, clearCSRFToken } from './csrf-client';

/**
 * Test CSRF functionality
 */
export async function testCSRF() {
  console.log('🔐 Testing CSRF functionality...');
  
  try {
    // Clear any existing token
    clearCSRFToken();
    console.log('✅ Cleared existing CSRF token');
    
    // Fetch new token
    const token = await getCSRFToken();
    console.log('✅ Successfully fetched CSRF token:', token.substring(0, 8) + '...');
    
    // Test token with API call
    const response = await fetch('/api/health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': token
      },
      credentials: 'include',
      body: JSON.stringify({ test: true })
    });
    
    if (response.ok) {
      console.log('✅ CSRF token validation successful');
      return true;
    } else {
      console.error('❌ CSRF token validation failed:', response.status, await response.text());
      return false;
    }
    
  } catch (error) {
    console.error('❌ CSRF test failed:', error);
    return false;
  }
}

/**
 * Debug CSRF cookies and headers
 */
export function debugCSRF() {
  const cookies = document.cookie.split(';').map(c => c.trim());
  const csrfCookie = cookies.find(c => c.startsWith('csrf-token='));
  
  console.log('🔍 CSRF Debug Info:');
  console.log('- CSRF Cookie:', csrfCookie || 'Not found');
  console.log('- All Cookies:', cookies);
  console.log('- Current URL:', window.location.href);
  console.log('- Protocol:', window.location.protocol);
  console.log('- Domain:', window.location.hostname);
}

/**
 * Manually refresh CSRF token
 */
export async function refreshCSRFToken() {
  console.log('🔄 Refreshing CSRF token...');
  clearCSRFToken();
  try {
    const newToken = await getCSRFToken();
    console.log('✅ New CSRF token obtained:', newToken.substring(0, 8) + '...');
    return newToken;
  } catch (error) {
    console.error('❌ Failed to refresh CSRF token:', error);
    throw error;
  }
}

// Make functions available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).debugCSRF = debugCSRF;
  (window as any).testCSRF = testCSRF;
  (window as any).refreshCSRFToken = refreshCSRFToken;
}