"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withiOSInfoPlist = (configuration, props = {}) => {
    return (0, config_plugins_1.withInfoPlist)(configuration, (config) => {
        const infoPlist = config.modResults;
        const { dictationMicrophoneUsageDescription, dictationSpeechRecognitionUsageDescription, } = props;
        if (typeof dictationMicrophoneUsageDescription === 'string') {
            infoPlist.NSMicrophoneUsageDescription =
                dictationMicrophoneUsageDescription;
        }
        if (typeof dictationSpeechRecognitionUsageDescription === 'string') {
            infoPlist.NSSpeechRecognitionUsageDescription =
                dictationSpeechRecognitionUsageDescription;
        }
        return config;
    });
};
exports.default = withiOSInfoPlist;
