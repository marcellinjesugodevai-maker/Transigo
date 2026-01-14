const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo (extend defaults, don't replace)
config.watchFolders = [...(config.watchFolders || []), workspaceRoot];

// 2. Resolve modules from both local and workspace root
config.resolver.nodeModulesPaths = [
    path.resolve(projectRoot, 'node_modules'),
    path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Ensure TS/TSX support and add custom extensions
config.resolver.sourceExts = [...config.resolver.sourceExts, 'cjs', 'mjs'];
config.resolver.assetExts = [...config.resolver.assetExts, 'fcfa'];

// 4. Force resolution of shared package
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
    '@transigo/shared': path.resolve(workspaceRoot, 'packages/shared'),
};

module.exports = config;
