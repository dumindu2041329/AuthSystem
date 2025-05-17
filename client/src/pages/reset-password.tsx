import { useState, useEffect } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Link, useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ResetPasswordValues, resetPasswordSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const { token } = useParams<{ token: string }>();
  const [, navigate] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  
  // Verify token validity
  const { isLoading: isVerifying, isError: isTokenInvalid } = useQuery({
    queryKey: ['/api/reset-password', token],
    queryFn: async () => {
      const response = await fetch(`/api/reset-password/${token}`, {
        credentials: "include"
      });
      
      if (!response.ok) {
        throw new Error("Invalid or expired token");
      }
      
      return response.json();
    },
    retry: false,
    enabled: !!token,
  });

  // Define form
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (values: ResetPasswordValues) => {
      const response = await fetch(`/api/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: values.password }),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      setResetSuccess(true);
      toast({
        title: "Password Reset Successful",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
        variant: "destructive",
      });
    },
  });

  // If no token is provided, redirect to forgot password
  useEffect(() => {
    if (!token) {
      navigate("/forgot-password");
    }
  }, [token, navigate]);

  // Form submission handler
  function onSubmit(values: ResetPasswordValues) {
    resetPasswordMutation.mutate(values);
  }

  // Toggle password visibility
  const togglePasswordVisibility = () => setShowPassword(!showPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  if (isVerifying) {
    return (
      <AuthLayout
        title="Reset Password"
        subtitle="Please wait while we verify your reset link"
      >
        <div className="flex justify-center items-center py-12">
          <Loader size="lg" />
        </div>
      </AuthLayout>
    );
  }

  if (isTokenInvalid) {
    return (
      <AuthLayout
        title="Invalid Reset Link"
        subtitle="This password reset link is invalid or has expired"
      >
        <div className="text-center space-y-6">
          <div className="p-6 bg-red-50 rounded-lg border border-red-100">
            <h3 className="text-xl font-semibold text-red-700 mb-2">Link Expired</h3>
            <p className="text-gray-600">
              The password reset link you've used is either invalid or has expired.
              Reset links are only valid for 1 hour after they are requested.
            </p>
          </div>
          
          <Button asChild className="w-full">
            <Link href="/forgot-password">Request a New Reset Link</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (resetSuccess) {
    return (
      <AuthLayout
        title="Password Reset Successful"
        subtitle="Your password has been successfully reset"
      >
        <div className="text-center space-y-6">
          <div className="p-6 bg-green-50 rounded-lg border border-green-100">
            <h3 className="text-xl font-semibold text-green-700 mb-2">Success!</h3>
            <p className="text-gray-600">
              Your password has been successfully reset. You can now log in to your account
              using your new password.
            </p>
          </div>
          
          <Button asChild className="w-full">
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your new password below"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Enter your new password" 
                      {...field} 
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      type={showConfirmPassword ? "text" : "password"} 
                      placeholder="Confirm your new password" 
                      {...field} 
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 text-gray-400 hover:text-gray-600"
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? (
              <Loader size="sm" className="mr-2" />
            ) : null}
            Reset Password
          </Button>
        </form>
      </Form>
    </AuthLayout>
  );
}