"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withiOSInfoPlist_1 = __importDefault(require("./withiOSInfoPlist"));
const withAndroidManifest_1 = __importDefault(require("./withAndroidManifest"));
// path should be relative to dist
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pkg = require('../package.json');
const withStreamChatReactNativeAi = (config, props) => {
    return (0, config_plugins_1.withPlugins)(config, [
        // ios
        () => (0, withiOSInfoPlist_1.default)(config, props),
        // android
        () => (0, withAndroidManifest_1.default)(config, props),
    ]);
};
exports.default = (0, config_plugins_1.createRunOncePlugin)(withStreamChatReactNativeAi, pkg.name, pkg.version);
