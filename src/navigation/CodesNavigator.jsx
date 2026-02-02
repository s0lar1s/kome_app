import { createNativeStackNavigator } from "@react-navigation/native-stack";
import CodesScreen from "../screens/CodesScreen";


export default function CodesNavigator() {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator>
            <Stack.Screen name="Codes" component={CodesScreen} />
        </Stack.Navigator>
    );
}