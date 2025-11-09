import { useQuery } from "@tanstack/react-query";

async function fetchUser() {
  try {
    const response = await fetch("/api/auth/user", {
      credentials: "include",
    });
    
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
    console.error("Auth fetch error:", error);
    return null;
  }
}

export function useAuth() {
  const { data: user, isLoading, isFetching, isSuccess, error, status } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    networkMode: 'always',
  });

  const isInitialLoading = status === 'pending';
  const isAuthenticated = !!user && status === 'success';
  
  // Determine auth status based on query status
  let authStatus: 'authenticated' | 'loading' | 'unauthenticated';
  if (status === 'pending') {
    authStatus = 'loading';
  } else if (status === 'success') {
    authStatus = user ? 'authenticated' : 'unauthenticated';
  } else {
    authStatus = 'unauthenticated';
  }

  return {
    user: user ?? null,
    isAuthenticated,
    isLoading: isLoading || isFetching,
    isInitialLoading,
    isSuccess,
    error,
    authStatus,
  };
}
