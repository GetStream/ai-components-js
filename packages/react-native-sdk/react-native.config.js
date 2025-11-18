module.exports = {
  dependency: {
    platforms: {
      android: {
        componentDescriptors: ['PerfTextComponentDescriptor'],
        cmakeListsPath: '../android/src/main/jni/CMakeLists.txt',
      },
      ios: null,
    },
  },
};
