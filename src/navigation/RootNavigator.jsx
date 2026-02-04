import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeNavigator from "./HomeNavigator";
import { Ionicons } from "@expo/vector-icons";

//my imports
import BrochuresNavigator from "./BrochuersNavigator";
import ClientCardsNavigator from "./ClientCardsNavigator";
import CodesNavigator from "./CodesNavigator";
import OthersNavigator from "./OthersNavigator";

export default function RootNavigator() {
    const Tabs = createBottomTabNavigator();

    return (
        <Tabs.Navigator
            screenOptions={{
            }}
        >
            <Tabs.Screen
                name="HomeTab"
                component={HomeNavigator}
                options={{
                    title: "Home",
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                    headerShown: false,
                }}
            />

            <Tabs.Screen
                name="BrochuresTab"
                component={BrochuresNavigator}
                options={{
                    title: "Brochures",
                    tabBarIcon: ({ color, size }) => <Ionicons name="newspaper" size={size} color={color} />,
                    headerShown: false
                }}
            />

            <Tabs.Screen
                name="ClientCardsTab"
                component={ClientCardsNavigator}
                options={{
                    title: "ClientCards",
                    tabBarIcon: ({ color, size }) => <Ionicons name="card" size={size} color={color} />,
                    headerShown: false
                }}
            />

            <Tabs.Screen
                name="CodesTab"
                component={CodesNavigator}
                options={{
                    title: "Promo codes",
                    tabBarIcon: ({ color, size }) => <Ionicons name="barcode" size={size} color={color} />,
                    headerShown: false
                }}
            />

            <Tabs.Screen
                name="OthersTab"
                component={OthersNavigator}
                options={{
                    title: "All others",
                    tabBarIcon: ({ color, size }) => <Ionicons name="apps" size={size} color={color} />,
                    headerShown: false
                }}
            />

        </Tabs.Navigator>
    );
}
