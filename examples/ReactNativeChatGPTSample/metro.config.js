// const path = require('path');
// const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
//
// const projectRoot = __dirname;
// const workspaceRoot = path.resolve(projectRoot, '../..');
//
// const defaultConfig = getDefaultConfig(projectRoot);
//
// module.exports = mergeConfig(defaultConfig, {
//   projectRoot,
//   watchFolders: [
//     workspaceRoot,
//     path.join(workspaceRoot, 'packages/react-native-sdk'),
//   ],
//   resolver: {
//     ...defaultConfig.resolver,
//     // Force Metro to resolve deps from the workspace root
//     nodeModulesPaths: [
//       path.join(projectRoot, 'node_modules'),
//       path.join(workspaceRoot, 'node_modules'),
//     ],
//     extraNodeModules: {
//       ...(defaultConfig.resolver?.extraNodeModules || {}),
//       react: path.join(workspaceRoot, 'node_modules/react'),
//       'react-native': path.join(workspaceRoot, 'node_modules/react-native'),
//       'react-native-svg': path.join(
//         workspaceRoot,
//         'node_modules/react-native-svg',
//       ),
//     },
//   },
// });

const { getDefaultConfig } = require('@react-native/metro-config');
const { exclusionList, resolveUniqueModule } = require('@rnx-kit/metro-config');
const MetroSymlinksResolver = require('@rnx-kit/metro-resolver-symlinks');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
const workspaceRoot = path.resolve(projectRoot, '../..');

config.watchFolders = [
  path.join(workspaceRoot, 'node_modules'),
  path.join(workspaceRoot, 'packages/react-native-sdk'),
];

// find what all modules need to be unique for the app
const dependencyPackageNames = Object.keys(
  require('./package.json').dependencies,
);

const uniqueModules = dependencyPackageNames.map((packageName) => {
  const [modulePath, blockPattern] = resolveUniqueModule(
    packageName,
    projectRoot,
  );
  return {
    packageName, // name of the package
    modulePath, // actual path to the module in the project's node modules
    blockPattern, // paths that match this pattern will be blocked from being resolved
  };
});

// provide the path for the unique modules
const extraNodeModules = uniqueModules.reduce((acc, item) => {
  acc[item.packageName] = item.modulePath;
  return acc;
}, {});

// block the other paths for unique modules from being resolved
const blockList = uniqueModules.map(({ blockPattern }) => blockPattern);

// using rnx-kit symlinks resolver to solve https://github.com/react-native-webrtc/react-native-webrtc/issues/1503
config.resolver.resolveRequest = MetroSymlinksResolver();

config.resolver.extraNodeModules = extraNodeModules;

config.resolver.blockList = exclusionList(blockList);

module.exports = config;
