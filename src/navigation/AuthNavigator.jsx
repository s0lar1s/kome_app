import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../screens/auth/LoginScreen.jsx";
import RegisterScreen from "../screens/auth/RegisterSreen.jsx";


export default function AuthNavigator() {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator>
            <Stack.Screen name="Login" component={LoginScreen} 
            options={{
                    title: "Вход",
                }}
            />
            <Stack.Screen name="Register" component={RegisterScreen} 
            options={{
                    title: "Регистрация",
                }}
            />
        </Stack.Navigator>
    );
}
