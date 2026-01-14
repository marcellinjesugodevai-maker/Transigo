module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            ['transform-inline-environment-variables', {
                'include': ['EXPO_ROUTER_APP_ROOT', 'EXPO_ROUTER_IMPORT_MODE']
            }],
            [
                'module-resolver',
                {
                    alias: {
                        '@transigo/shared': '../../packages/shared/src/index.ts',
                    },
                },
            ],
            'react-native-reanimated/plugin',
        ],
        overrides: [
            {
                test: (fileName) => {
                    if (!fileName) return false;
                    return fileName.includes('node_modules/react-native/') || fileName.includes('node_modules\\react-native\\');
                },
                presets: ['babel-preset-expo'],
            },
        ],
    };
};
