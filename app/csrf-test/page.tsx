"use client"

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { testCSRF, debugCSRF, refreshCSRFToken } from '@/lib/csrf-debug';
import { apiClient } from '@/lib/api-client';

export default function CSRFTestPage() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runCSRFTest = async () => {
    setIsLoading(true);
    addResult("Starting CSRF test...");
    
    try {
      const success = await testCSRF();
      addResult(success ? "✅ CSRF test passed" : "❌ CSRF test failed");
    } catch (error) {
      addResult(`❌ CSRF test error: ${error}`);
    }
    
    setIsLoading(false);
  };

  const testApiCall = async () => {
    setIsLoading(true);
    addResult("Testing API call with CSRF...");
    
    try {
      const response = await apiClient.post('/api/health', { test: true });
      addResult("✅ API call successful");
    } catch (error) {
      addResult(`❌ API call failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const refreshToken = async () => {
    setIsLoading(true);
    addResult("Refreshing CSRF token...");
    
    try {
      const token = await refreshCSRFToken();
      addResult(`✅ Token refreshed: ${token.substring(0, 8)}...`);
    } catch (error) {
      addResult(`❌ Token refresh failed: ${error}`);
    }
    
    setIsLoading(false);
  };

  const showDebugInfo = () => {
    debugCSRF();
    addResult("🔍 Debug info logged to console");
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>CSRF Testing & Debugging</CardTitle>
          <CardDescription>
            Use these tools to test and debug CSRF token functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button onClick={runCSRFTest} disabled={isLoading}>
              Run CSRF Test
            </Button>
            <Button onClick={testApiCall} disabled={isLoading}>
              Test API Call
            </Button>
            <Button onClick={refreshToken} disabled={isLoading}>
              Refresh Token
            </Button>
            <Button onClick={showDebugInfo} variant="outline">
              Debug Info
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={clearResults} variant="outline" size="sm">
              Clear Results
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto">
                {testResults.length === 0 ? (
                  <p className="text-gray-500">No test results yet. Click a button above to start testing.</p>
                ) : (
                  <div className="space-y-1">
                    {testResults.map((result, index) => (
                      <div key={index} className="font-mono text-sm">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Common CSRF Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Issue:</strong> "Invalid or missing CSRF token" on form submissions<br/>
                  <strong>Solution:</strong> Ensure the page loads the CSRF token before form submission. Try refreshing the page.
                </div>
                <div>
                  <strong>Issue:</strong> CSRF failures in development with localhost<br/>
                  <strong>Solution:</strong> Check cookie SameSite settings and ensure HTTPS in production.
                </div>
                <div>
                  <strong>Issue:</strong> Token mismatch after user inactivity<br/>
                  <strong>Solution:</strong> Tokens expire after 7 days. Clear browser storage or refresh token.
                </div>
                <div>
                  <strong>Issue:</strong> CSRF failing in production but working locally<br/>
                  <strong>Solution:</strong> Verify cookie security settings and domain configuration.
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}