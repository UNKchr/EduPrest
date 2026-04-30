import { useEffect, useState } from "react";
import { authApi } from "../services/authApi";
import { setOnLogout } from "../services/authEvents";
import { AuthContext, type User } from "./AuthContext";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    const u = await authApi.login(email, password);
    setUser(u);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  useEffect(() => {
    setOnLogout(() => setUser(null));
    authApi
      .refresh()
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};