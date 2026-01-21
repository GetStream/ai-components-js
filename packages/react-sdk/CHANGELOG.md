# @stream-io/chat-react-ai

## 0.2.0

### Minor Changes

- 6841c35: This change adds the `skipAnimation` function as a return value of the `useMessageTextStreaming` hook and adds the ability for integrators to access this function through a ref of the `StreamingMessage` component. This function allows integrators to skip typewriter animation in progress when, for example, `ai_indicator.stop` event arrives on an active channel.

## 0.1.2

### Patch Changes

- 83d7bc4: Adjust styling and certain prop types, add `material-symbols` as a peer dep

## 0.1.1

### Patch Changes

- 0f42db4: fix: don't preset background color

## 0.1.0

### Minor Changes

- b4f5397: Initial release of the React SDK
