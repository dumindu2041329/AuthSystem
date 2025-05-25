import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { signInWithGoogle } from "@/lib/firebase";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { User } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

export function GoogleAuthButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [, navigate] = useLocation();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;

      // Send the Firebase user data to our backend
      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Authentication failed");
      }

      const userData: User = await response.json();

      // Update the user data in the query cache immediately
      queryClient.setQueryData(["/api/user"], userData);

      toast({
        title: "Success!",
        description: "You have been signed in successfully.",
      });

      // Navigate to dashboard without page reload
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      
      // Handle specific Firebase auth errors
      if (error.code === "auth/unauthorized-domain") {
        const currentDomain = window.location.hostname;
        toast({
          title: "Domain not authorized",
          description: `Your domain "${currentDomain}" needs to be added to Firebase Authentication authorized domains. Please update your Firebase settings.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Authentication failed",
          description: error instanceof Error ? error.message : "Failed to authenticate with Google",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={handleGoogleSignIn}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader size="sm" className="mr-2" /> Signing in...
        </>
      ) : (
        <>
          <svg
            className="mr-2 h-4 w-4"
            aria-hidden="true"
            focusable="false"
            data-prefix="fab"
            data-icon="google"
            role="img"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 488 512"
          >
            <path
              fill="currentColor"
              d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
            ></path>
          </svg>
          Sign in with Google
        </>
      )}
    </Button>
  );
}