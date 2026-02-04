import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ClientCardsScreen from "../screens/ClientCardsScreen";


export default function ClientCardsNavigator() {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator>
            <Stack.Screen 
            name="Client - Cards" 
            component={ClientCardsScreen}
            options={{
                title: "Клиентски карти", // 👈 това ще е табелката
            }}
            />
        </Stack.Navigator>
    );
}