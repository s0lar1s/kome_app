import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ShopsScreen from "../screens/shops/ShopsScreen";
import ShopsListScreen from "../screens/shops/ShopsListScreen";


export default function ShopsNavigator() {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="ShopsList" 
                component={ShopsListScreen} 
                options={{
                    title: "Коме магазини",
                }}
            />
            
            <Stack.Screen 
                name="ShopsDetails" 
                component={ShopsScreen} 
                options={{
                    title: "",
                }}
            />
        </Stack.Navigator>
    );
}