import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import BrochuresScreen from "../screens/brochures/BrochuresScreen";
import BannersDetailsScreen from "../screens/BannersDetailScreen";
import ProductsListScreen from "../screens/products/ProductsListScreen";
import ProductsScreen from "../screens/products/ProductsScreen";
import CardHowToGetScreen from "../screens/CardHowToGetScreen";
import ShopsListScreen from "../screens/shops/ShopsListScreen";

export default function HomeNavigator() {
  const Stack = createNativeStackNavigator();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "CBA Kome" }}
      />

      <Stack.Screen
        name="Brochures"
        component={BrochuresScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route?.params?.title || "",
        })}
      />

      <Stack.Screen
        name="BannersDetail"
        component={BannersDetailsScreen}
        options={({ route }) => ({
          headerShown: true,
          title: route?.params?.title || "",
        })}
      />

      <Stack.Screen
        name="Products"
        component={ProductsListScreen}
        options={{ 
          headerShown: true,
          title: "Продукти" }}
      />

      <Stack.Screen
        name="ProductDetails"
        component={ProductsScreen}
        options={{ 
          headerShown: true,
          title: "Продукт" 
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
          title: "Обекти",
        }}
      />
    </Stack.Navigator>
  );
}