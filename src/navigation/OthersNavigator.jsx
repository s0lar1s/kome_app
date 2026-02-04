import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OthersScreen from "../screens/OthersScreen";


export default function OthersNavigator() {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="Others" 
                component={OthersScreen} 
                options={{
                    title: "Други", // 👈 това ще е табелката
                }}
            />
        </Stack.Navigator>
    );
}