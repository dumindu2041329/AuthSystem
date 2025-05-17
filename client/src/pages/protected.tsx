import { useRequireAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Loader } from "@/components/ui/loader";
import { LockIcon, ShieldCheck } from "lucide-react";

export default function Protected() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <DashboardLayout title="Protected Content">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <ShieldCheck className="h-8 w-8 text-primary" />
          <div>
            <CardTitle>Protected Content</CardTitle>
            <CardDescription>This page is only accessible to authenticated users</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-100">
            <LockIcon className="h-12 w-12 text-primary mb-4" />
            <h2 className="text-xl font-semibold text-center mb-2">Authenticated Access Only</h2>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Congratulations! You're viewing content that's protected by authentication. 
              Only logged-in users can see this page.
            </p>
            <Button asChild>
              <Link href="/dashboard">Return to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
