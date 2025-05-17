import { useState } from "react";
import { AuthLayout } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
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
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { ForgotPasswordValues, forgotPasswordSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function ForgotPassword() {
  const [emailSent, setEmailSent] = useState(false);
  
  // Define form
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Setup mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (values: ForgotPasswordValues) => {
      const response = await fetch('/api/forgot-password', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
        credentials: "include"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || response.statusText);
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      setEmailSent(true);
      toast({
        title: "Reset Link Sent",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send reset link. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  function onSubmit(values: ForgotPasswordValues) {
    forgotPasswordMutation.mutate(values);
  }

  return (
    <AuthLayout
      title="Forgot Password"
      subtitle="Enter your email address to receive a password reset link"
    >
      {emailSent ? (
        <div className="text-center space-y-6">
          <div className="p-6 bg-green-50 rounded-lg border border-green-100">
            <h3 className="text-xl font-semibold text-green-700 mb-2">Email Sent!</h3>
            <p className="text-gray-600">
              If the email address you entered is associated with an account, you will receive
              a password reset link. Please check your inbox and follow the instructions.
            </p>
            <p className="text-gray-500 text-sm mt-4">
              Don't see an email? Check your spam folder or make sure you've entered the correct email address.
            </p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Button asChild>
              <Link href="/login">Return to Login</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEmailSent(false);
                form.reset();
              }}
            >
              Try a different email
            </Button>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email address" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={forgotPasswordMutation.isPending}
              >
                {forgotPasswordMutation.isPending ? (
                  <Loader size="sm" className="mr-2" />
                ) : null}
                Send Reset Link
              </Button>

              <div className="flex justify-center">
                <Button variant="link" asChild>
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            </div>
          </form>
        </Form>
      )}
    </AuthLayout>
  );
}