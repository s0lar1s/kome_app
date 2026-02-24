import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ClientCardsScreen from "../screens/ClientCardsScreen";
import CardHowToGetScreen from "../screens/CardHowToGetScreen";
import VirtualCardCreateScreen from "../screens/VirtualCardCreateScreen";
import AuthNavigator from "./AuthNavigator.jsx";
import { useAuth } from "../contexts/auth/useAuth.js";

const Stack = createNativeStackNavigator();

export default function ClientCardsNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen
            name="Client - Cards"
            component={ClientCardsScreen}
            options={{ title: "Клиентски карти" }}
          />

          <Stack.Screen
            name="CardHowToGet"
            component={CardHowToGetScreen}
            options={{
              headerShown: true,
              title: "Физическа карта",
            }}
          />

          <Stack.Screen
            name="VirtualCardCreate"
            component={VirtualCardCreateScreen}
            options={{
              headerShown: true,
              title: "Виртуална карта",
            }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}