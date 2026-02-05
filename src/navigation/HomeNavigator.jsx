import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "../screens/HomeScreen";
import BrochuresScreen from "../screens/BrochuresScreen";
import ClientCardsScreen from "../screens/ClientCardsScreen";
import BannersDetailsScreen from "../screens/BannersDetailScreen";


export default function HomeNavigator() {
    const Stack = createNativeStackNavigator();

    return (
        <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Brochures" component={BrochuresScreen} />
            <Stack.Screen name="ClientCards" component={ClientCardsScreen} />
            <Stack.Screen name="BannersDetail" component={BannersDetailsScreen} />
        </Stack.Navigator>
    );
}