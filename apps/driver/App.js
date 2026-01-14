import 'react-native-url-polyfill/auto';
import { ExpoRoot } from 'expo-router';
import { AppRegistry, Platform } from 'react-native';

// Explicitly require the context of the app directory
// This fixes the issue where Expo Router cannot locate the root in the monorepo
const ctx = require.context('./app');

export default function App() {
    return <ExpoRoot context={ctx} />;
}

// Ensure the app is registered correctly
const appName = 'main';

if (Platform.OS === 'web') {
    const rootTag = document.getElementById('root') ?? document.getElementById('main');
    AppRegistry.runApplication(appName, { rootTag });
} else {
    AppRegistry.registerComponent(appName, () => App);
}
