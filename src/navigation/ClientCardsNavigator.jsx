import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ClientCardsScreen from "../screens/ClientCardsScreen";


export default function ClientCardsNavigator() {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator>
            <Stack.Screen name="Brochures" component={ClientCardsScreen} />
        </Stack.Navigator>
    );
}