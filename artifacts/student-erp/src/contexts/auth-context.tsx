import { createContext, ReactNode, useState, useEffect } from "react";
import { useGetMe, getGetMeQueryKey, UserSession } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  logoutClient: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  logoutClient: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe({
    query: { retry: false, queryKey: getGetMeQueryKey() },
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
}
