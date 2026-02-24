import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import BrochuresScreen from "../screens/brochures/BrochuresScreen";
import ClientCardsScreen from "../screens/ClientCardsScreen";
import BannersDetailsScreen from "../screens/BannersDetailScreen";
import ProductsListScreen from "../screens/products/ProductsListScreen";
import ProductsScreen from "../screens/products/ProductsScreen";
import CardHowToGetScreen from "../screens/CardHowToGetScreen";
import ShopsListScreen from "../screens/shops/ShopsListScreen";
import ClientCardsNavigator from "./ClientCardsNavigator.jsx";

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

      <Stack.Screen
        name="BannersDetail"
        component={BannersDetailsScreen}
        options={({ route }) => ({
          title: route?.params?.title || "",
        })}
      />

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

      
      <Stack.Screen
          name="ClientCardsFlow"
          component={ClientCardsNavigator}
          options={{
              headerShown: true,
              title: "Клиентска карта",
            }}
      />
      
      <Stack.Screen
          name="CardHowToGet"
          component={CardHowToGetScreen}
          options={{
              headerShown: true,
              title: "Информация",
            }}
      />

      <Stack.Screen
          name="ShopsList"
          component={ShopsListScreen}
          options={{
              headerShown: true,
              title: "Информация",
            }}
      />

    </Stack.Navigator>
  );
}
