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
  const { data: user, isLoading, status } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  return {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading,
  };
}
