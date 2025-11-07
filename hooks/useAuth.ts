import { useQuery } from "@tanstack/react-query";

async function fetchUser() {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });
  if (!response.ok) {
    if (response.status === 401) {
      return null;
    }
    throw new Error("Failed to fetch user");
  }
  const data = await response.json();
  return data.user;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    error,
  };
}
