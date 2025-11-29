const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const defaultConfig = getDefaultConfig(projectRoot);

module.exports = mergeConfig(defaultConfig, {
  projectRoot,
  watchFolders: [
    workspaceRoot,
    path.join(workspaceRoot, 'packages/react-native-sdk'),
  ],
  resolver: {
    ...defaultConfig.resolver,
    // Force Metro to resolve deps from the workspace root
    nodeModulesPaths: [
      path.join(projectRoot, 'node_modules'),
      path.join(workspaceRoot, 'node_modules'),
    ],
    extraNodeModules: {
      ...(defaultConfig.resolver?.extraNodeModules || {}),
      react: path.join(workspaceRoot, 'node_modules/react'),
      'react-native': path.join(workspaceRoot, 'node_modules/react-native'),
      'react-native-svg': path.join(
        workspaceRoot,
        'node_modules/react-native-svg',
      ),
    },
  },
});
