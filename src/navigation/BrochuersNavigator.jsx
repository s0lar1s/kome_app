import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BrochuresScreen from "../screens/BrochuresScreen";
import BrochuresListScreen from "../screens/BrochuresListScreen";


export default function BrochuresNavigator() {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator>
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
                    title: "Брошура",
                }}
            />
        </Stack.Navigator>
    );
}