import { useContext } from "react";
import { AuthContext } from "./AuthProvider.jsx";

export function useAuth() {
    const context = useContext(AuthContext);

    return context;
}
