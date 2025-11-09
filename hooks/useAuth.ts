import { useQuery } from "@tanstack/react-query";

async function fetchUser() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch("/api/auth/user", {
      credentials: "include",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (response.status === 401) {
      return null;
    }
    
    if (!response.ok) {
      console.error("Auth check failed:", response.status);
      return null;
    }
    
    const data = await response.json();
    return data.user;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error("Auth check timed out");
    } else {
      console.error("Auth fetch error:", error);
    }
    return null;
  }
}

export function useAuth() {
  const { data: user, isLoading, isFetching, isSuccess, error, status } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: 1,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    networkMode: 'always',
  });

  const isInitialLoading = isLoading && !isFetching && status === 'pending';
  const isAuthenticated = !!user && isSuccess;

  return {
    user: user ?? null,
    isAuthenticated,
    isLoading: isLoading || isFetching,
    isInitialLoading,
    isSuccess,
    error,
    authStatus: isAuthenticated ? 'authenticated' : (isLoading || isFetching) ? 'loading' : 'unauthenticated',
  };
}
