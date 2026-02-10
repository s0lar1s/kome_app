import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ClientCardsScreen from "../screens/ClientCardsScreen";
import AuthNavigator from "./AuthNavigator.jsx";
import { useAuth } from "../contexts/auth/useAuth.js";

export default function ClientCardsNavigator() {
    const Stack = createNativeStackNavigator();
    const { isAuthenticated } = useAuth();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated
                ? <Stack.Screen 
                    name="Client - Cards" 
                    component={ClientCardsScreen}
                    options={{
                        title: "Клиентски карти",
                    }}
                />
                : <Stack.Screen name="Auth" 
                    component={AuthNavigator} 
                 />
            }
        </Stack.Navigator>
    );
}