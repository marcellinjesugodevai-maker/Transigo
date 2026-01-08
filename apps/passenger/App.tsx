import 'react-native-url-polyfill/auto';
import { ExpoRoot } from 'expo-router';
import { AppRegistry } from 'react-native';

// Explicitly require the context of the app directory
const ctx = (require as any).context('./app');

export default function App() {
    return <ExpoRoot context={ctx} />;
}

AppRegistry.registerComponent('main', () => App);
