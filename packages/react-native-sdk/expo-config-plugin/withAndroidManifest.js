"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_plugins_1 = require("@expo/config-plugins");
const withStreamAndroidManifest = (configuration, _props) => {
    return (0, config_plugins_1.withAndroidManifest)(configuration, (config) => {
        const androidManifest = config.modResults;
        const manifest = androidManifest.manifest;
        if (!Array.isArray(manifest['uses-permission'])) {
            manifest['uses-permission'] = [];
        }
        const permissions = manifest['uses-permission'];
        const hasRecordAudio = permissions.some((item) => item.$?.['android:name'] === 'android.permission.RECORD_AUDIO');
        if (!hasRecordAudio) {
            permissions.push({
                $: {
                    'android:name': 'android.permission.RECORD_AUDIO',
                },
            });
        }
        return config;
    });
};
exports.default = withStreamAndroidManifest;
