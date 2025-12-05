---
'ReactNativeChatGPTSample': patch
'expochatgptsample': patch
'@stream-io/chat-react-native-ai': patch
---

- Introduce expo config plugin for dictation permissions
- Fix race condition when no permissions are yet present on ios dictation
- Include Expo sample app as well
- Fix wrong dependency graph resolution between RNCLI and Expo sample apps
