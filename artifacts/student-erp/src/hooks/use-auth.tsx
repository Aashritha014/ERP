import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useGetMe, UserSession } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Spinner } from "@/components/ui/spinner";

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  logoutClient: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logoutClient: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading, isError, error } = useGetMe({
    query: {
      retry: false,
    },
  });

  const [localUser, setLocalUser] = useState<UserSession | null>(null);

  useEffect(() => {
    if (user) {
      setLocalUser(user);
    } else if (isError) {
      setLocalUser(null);
    }
  }, [user, isError]);

  const logoutClient = () => {
    setLocalUser(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user: localUser, isLoading, logoutClient }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export const ProtectedRoute = ({ children, allowedRoles }: { children: ReactNode, allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && allowedRoles && !allowedRoles.includes(user.role)) {
      // Redirect to correct dashboard based on role
      if (user.role === 'admin') setLocation("/admin/dashboard");
      else if (user.role === 'student') setLocation("/student/dashboard");
      else if (user.role === 'faculty') setLocation("/faculty/dashboard");
      else setLocation("/");
    }
  }, [user, isLoading, setLocation, allowedRoles]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null; // Will redirect
  }

  return <>{children}</>;
};
