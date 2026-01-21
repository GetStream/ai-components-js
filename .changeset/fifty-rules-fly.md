---
'@stream-io/chat-react-ai': minor
---

This change adds the `skipAnimation` function as a return value of the `useMessageTextStreaming` hook and adds the ability for integrators to access this function through a ref of the `StreamingMessage` component. This function allows integrators to skip typewriter animation in progress when, for example, `ai_indicator.stop` event arrives on an active channel.
