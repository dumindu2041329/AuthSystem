import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useLocation } from "wouter";
import { useEffect } from "react";

export function useAuth() {
  const [, navigate] = useLocation();
  
  const { 
    data: user, 
    isLoading,
    isError,
    error
  } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const isAuthenticated = !!user;
  
  return {
    user,
    isLoading,
    isError,
    error,
    isAuthenticated,
  };
}

// Hook to redirect if not authenticated
export function useRequireAuth(redirectTo = "/login") {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);
  
  return { isLoading, isAuthenticated };
}
