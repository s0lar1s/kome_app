import { createContext, useState } from "react";
import { authService } from "../../Api/index.js";
import { usePersistedState } from "../../hooks/usePersistedState.js";

export const AuthContext = createContext({
  isLoading: false,
  isAuthenticated: false,
  error: null,
  user: null,
  auth: null,
  accessToken: null, // ✅ добавено
  login: async (email, password) => {},
  register: async (email, password, name) => {},
  clearError: () => {},
  logout: () => {},
});

function getErrMsg(err) {
  return err?.response?.data?.error || err?.message || "An error occurred";
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = usePersistedState("auth", {
    accessToken: null,
    user: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (email, password) => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await authService.login(email, password);
      const user = data?.user ?? null;
      const accessToken = data?.accessToken ?? null;

      if (!data?.ok || !user) {
        throw new Error(data?.error || "Login failed");
      }

      setAuth({ user, accessToken });
      return data;
    } catch (err) {
      const msg = getErrMsg(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email, password, name) => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await authService.register(email, password, name);
      const user = data?.user ?? null;
      const accessToken = data?.accessToken ?? null;

      if (!data?.ok || !user) {
        throw new Error(data?.error || "Registration failed");
      }

      setAuth({ user, accessToken });
      return data;
    } catch (err) {
      const msg = getErrMsg(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setAuth({ accessToken: null, user: null });
  };

  const contextValue = {
    isAuthenticated: !!auth?.user,
    isLoading,
    error,
    user: auth?.user ?? null,
    auth,
    accessToken: auth?.accessToken ?? null, // ✅ добавено (ключовото)
    clearError: () => setError(null),
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}