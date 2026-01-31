import { StatusBar } from 'expo-status-bar';
import RootNavigator from './navigation/RootNavigator';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
    return (
        <NavigationContainer>

            <StatusBar style="auto" />

            <RootNavigator />
        </NavigationContainer>
    );
}
