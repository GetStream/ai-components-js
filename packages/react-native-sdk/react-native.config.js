module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: './android',
        packageImportPath:
          'import com.streamio.aicomponents.renderkit.RenderKitPackage;',
        packageInstance: 'new RenderKitPackage()',
      },
      ios: null,
    },
  },
};
