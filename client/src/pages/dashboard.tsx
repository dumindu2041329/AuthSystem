import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Loader } from "@/components/ui/loader";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useEffect } from "react";

export default function Dashboard() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/login");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <DashboardLayout title="Dashboard">
      {/* Welcome Card */}
      <Card className="bg-gray-50 border border-gray-100 mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-2">
            Welcome back, {user?.firstName || "User"}!
          </h2>
          <p className="text-gray-600">
            You've successfully logged into your account.
          </p>
        </CardContent>
      </Card>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Completion Card */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Profile Completion
              </h3>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Completed
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-semibold text-gray-800">100%</span>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Status Card */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">
                Account Status
              </h3>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              Your account is active and in good standing.
            </p>
          </CardContent>
        </Card>

        {/* Last Login Card */}
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-500 text-sm font-medium">Last Login</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Protected Content Link */}
      <div className="mt-6">
        <Button asChild variant="outline">
          <Link href="/protected">View Protected Content</Link>
        </Button>
      </div>
    </DashboardLayout>
  );
}
