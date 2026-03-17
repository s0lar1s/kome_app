import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BrochuresScreen from "../screens/brochures/BrochuresScreen";
import BrochuresListScreen from "../screens/brochures/BrochuresListScreen";


export default function BrochuresNavigator() {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen 
                name="BrochuresList" 
                component={BrochuresListScreen} 
                options={{
                    title: "Актуални брошури",
                }}
            />
            
            <Stack.Screen 
                name="Brochures" 
                component={BrochuresScreen} 
                options={{
                    headerShown: true,
                    title: "",
                }}
            />
        </Stack.Navigator>
    );
}