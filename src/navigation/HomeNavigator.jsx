import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import BrochuresScreen from "../screens/brochures/BrochuresScreen";
import ClientCardsScreen from "../screens/ClientCardsScreen";
import BannersDetailsScreen from "../screens/BannersDetailScreen";
import ProductsListScreen from "../screens/products/ProductsListScreen";
import ProductsScreen from "../screens/products/ProductsScreen";


import { useAuth } from "../contexts/auth/useAuth.js";

export default function HomeNavigator() {
  const Stack = createNativeStackNavigator();
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "CBA Kome" }}
      />

      <Stack.Screen
        name="Brochures"
        component={BrochuresScreen}
        options={({ route }) => ({
          title: route?.params?.title || "",
        })}
      />

      <Stack.Screen name="ClientCards" component={ClientCardsScreen} />

      <Stack.Screen
        name="BannersDetail"
        component={BannersDetailsScreen}
        options={({ route }) => ({
          title: route?.params?.title || "",
        })}
      />

      {/* PRODUCTS */}
      <Stack.Screen
        name="Products"
        component={ProductsListScreen}
        options={{ title: "Продукти" }}
      />

      <Stack.Screen
        name="ProductDetails"
        component={ProductsScreen}
        options={{ title: "Продукт" }}
      />
    </Stack.Navigator>
  );
}
