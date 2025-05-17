import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader } from "@/components/ui/loader";

export default function Home() {
  const { user, isLoading, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">MyApp</span>
            </div>
            <div>
              {isLoading ? (
                <Loader />
              ) : user ? (
                <div className="flex space-x-4">
                  <Button asChild variant="ghost">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <>
                        <Loader size="sm" className="mr-2" /> Signing out...
                      </>
                    ) : (
                      "Sign out"
                    )}
                  </Button>
                </div>
              ) : (
                <div className="flex space-x-4">
                  <Button asChild variant="ghost">
                    <Link href="/login">Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/register">Sign up</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Welcome to MyApp
            </h1>
            <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
              A secure login/register system built with React and Express
            </p>
            <div className="mt-8 flex justify-center">
              {isLoading ? (
                <Loader size="lg" />
              ) : user ? (
                <Button asChild size="lg">
                  <Link href="/dashboard">Go to Dashboard</Link>
                </Button>
              ) : (
                <Button asChild size="lg">
                  <Link href="/login">Get Started</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 overflow-hidden sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} MyApp. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
