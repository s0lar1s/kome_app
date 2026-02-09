import { createContext, useState } from "react";
import { authService } from "../../Api/index.js";
import { usePersistedState } from "../../hooks/usePersistedState.js";

export const AuthContext = createContext({
    isLoading: false,
    isAuthenticated: false,
    error: null,
    user: null,
    auth: null,
    login: async (email, password) => { },
    register: async (email, password, name) => { },
    clearError: () => { },
    logout: () => { },
});

export function AuthProvider({ children }) {
    const [auth, setAuth] = usePersistedState("auth", {
        accessToken: null,
        user: null,
    });

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const login = async (email, password) => {
        try {
            setIsLoading(true);
            const { user, accessToken } = await authService.login(email, password);
            setAuth({ user, accessToken });
        } catch (err) {
            setError(err.message || 'An error occurred during login');
        } finally {
            setIsLoading(false);
        }
    }
    const register = async (email, password, name) => {
        try {
            setIsLoading(true);
            const { user, accessToken } = await authService.register(email, password, name);
            setAuth({ user, accessToken });
        } catch (err) {
            setError(err.message || 'An error occurred during registration');
        }
        finally {
            setIsLoading(false);
        }
    }

    const contextValue = {
        isAuthenticated: !!auth.user,
        isLoading,
        error,
        user: auth.user,
        auth,
        clearError: () => setError(null),
        login,
        register,
        logout: () => {
            setAuth({
                accessToken: null,
                user: null,
            });
        },
    };
    
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
}
