import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import BrochuresScreen from "../screens/BrochuresScreen";
import ClientCardsScreen from "../screens/ClientCardsScreen";
import BannersDetailsScreen from "../screens/BannersDetailScreen";
import AuthNavigator from "./AuthNavigator.jsx";

import { useAuth } from "../contexts/auth/useAuth.js";

export default function HomeNavigator() {
    const Stack = createNativeStackNavigator();
    const { isAuthenticated } = useAuth();

    return (
        <Stack.Navigator>

            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Brochures" component={BrochuresScreen} />
            {/* {isAuthenticated
                ? <Stack.Screen name="ClientCards" component={ClientCardsScreen} />
                : <Stack.Screen name="Auth" component={AuthNavigator} />
            } */}
            <Stack.Screen name="ClientCards" component={ClientCardsScreen} />
            <Stack.Screen name="BannersDetail" component={BannersDetailsScreen} />
        </Stack.Navigator>
    );
}