import { createNativeStackNavigator } from "@react-navigation/native-stack";
import OthersScreen from "../screens/OthersScreen";
import ShopsScreen from "../screens/shops/ShopsScreen";
import ShopsListScreen from "../screens/shops/ShopsListScreen";
import ShoppingListScreen from "../screens/ShoppingListScreen";

export default function OthersNavigator() {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator>
            <Stack.Screen 
                name="Others" 
                component={OthersScreen} 
                options={{
                    title: "Други",
                }}
            />

            <Stack.Screen
                name="ShopsList"
                component={ShopsListScreen}
                options={{ title: "Коме магазини" }}
            />

            <Stack.Screen
                name="ShopDetails"
                component={ShopsScreen}
                options={{ title: "Обект" }}
            />

            <Stack.Screen
                name="ShoppingList"
                component={ShoppingListScreen}
                options={{ title: "Списък за пазаруване" }}
            />

        </Stack.Navigator>
    );
}

