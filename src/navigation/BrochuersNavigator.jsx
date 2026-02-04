import { createNativeStackNavigator } from "@react-navigation/native-stack";
import BrochuresScreen from "../screens/BrochuresScreen";


export default function BrochuresNavigator() {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="Brochures" 
                component={BrochuresScreen} 
                options={{
                    title: "Брошури",
                }}
            />
        </Stack.Navigator>
    );
}