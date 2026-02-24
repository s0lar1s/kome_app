import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PromoCodesListScreen from "../screens/promocodes/PromoCodesListScreen";
import PromoCodeDetailsScreen from "../screens/promocodes/PromoCodeDetailsScreen";

const Stack = createNativeStackNavigator();

export default function CodesNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Codes"
        component={PromoCodesListScreen}
        options={{ title: "Промо кодове" }}
      />

      <Stack.Screen
        name="PromoCodeDetails"
        component={PromoCodeDetailsScreen}
        options={{ title: "" }}
      />
    </Stack.Navigator>
  );
}