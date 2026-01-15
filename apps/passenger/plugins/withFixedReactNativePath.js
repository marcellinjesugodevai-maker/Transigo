// Custom Expo Config Plugin to fix monorepo settings.gradle path issue
// This fixes the "Included build '/home/expo/workingdir/build/apps/passenger/android/null' does not exist" error

const { withSettingsGradle } = require("expo/config-plugins");

const withFixedReactNativePath = (config) => {
    return withSettingsGradle(config, (config) => {
        // Replace the problematic null path with the correct relative path
        // The issue is that in monorepos, the reactNativeDir can resolve to null
        // We need to ensure it points to the correct react-native location

        let contents = config.modResults.contents;

        // Fix the includeBuild path that might contain 'null'
        // Replace patterns like: includeBuild("null/ReactAndroid") with the correct path
        contents = contents.replace(
            /includeBuild\s*\(\s*['"]\s*null/g,
            'includeBuild("../../../node_modules/react-native'
        );

        // Also fix any direct null references in the react plugin path
        contents = contents.replace(
            /file\s*\(\s*['"]\s*null/g,
            'file("../../../node_modules/react-native'
        );

        // Ensure reactNativeDir is set correctly if it's referencing null
        contents = contents.replace(
            /reactNativeDir\s*=\s*null/g,
            'reactNativeDir = file("../../../node_modules/react-native")'
        );

        config.modResults.contents = contents;
        return config;
    });
};

module.exports = withFixedReactNativePath;
