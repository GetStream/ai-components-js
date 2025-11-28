# Implementation Plan: ChatGPT 4/Plus UI Redesign

## Design Goals
- Match ChatGPT 4/Plus dark theme with premium feel
- Component-based architecture with isolated SCSS modules
- Collapsible sidebar for mobile responsiveness
- Override Stream Chat React styles via CSS variables

---

## Component Structure

```
src/
├── components/
│   ├── AIChatApp/
│   │   ├── AIChatApp.tsx          # Main app wrapper
│   │   └── AIChatApp.scss         # App layout styles
│   ├── Sidebar/
│   │   ├── Sidebar.tsx            # Channel list sidebar
│   │   ├── Sidebar.scss           # Dark sidebar styles
│   │   ├── SidebarHeader.tsx      # New chat button
│   │   ├── SidebarHeader.scss
│   │   ├── ChannelPreviewItem.tsx # Custom channel preview
│   │   └── ChannelPreviewItem.scss
│   ├── ChatContainer/
│   │   ├── ChatContainer.tsx      # Main chat area wrapper
│   │   └── ChatContainer.scss
│   ├── MessageBubble/
│   │   ├── MessageBubble.tsx      # Custom message component
│   │   └── MessageBubble.scss     # ChatGPT-style bubbles
│   ├── MessageInputBar/
│   │   ├── MessageInputBar.tsx    # AIMessageComposer wrapper
│   │   └── MessageInputBar.scss   # Input styling
│   └── EmptyState/
│       ├── EmptyState.tsx         # Empty placeholder
│       └── EmptyState.scss
├── Root.tsx                       # Thin wrapper, imports AIChatApp
├── index.scss                     # Global styles + CSS variables
└── ai-demo.scss                   # New file for component-specific overrides
```

---

## ChatGPT 4/Plus Color Scheme

**CSS Variables to add in `index.scss`:**
```scss
:root {
  /* Dark theme colors matching ChatGPT 4 */
  --ai-demo-bg-primary: #0c0c0c;           // Main background
  --ai-demo-bg-secondary: #171717;         // Sidebar background
  --ai-demo-bg-tertiary: #202020;          // Hover states
  --ai-demo-border: #2f2f2f;               // Borders

  /* Text colors */
  --ai-demo-text-primary: #ececec;         // Main text
  --ai-demo-text-secondary: #b4b4b4;       // Secondary text
  --ai-demo-text-tertiary: #8e8e8e;        // Muted text

  /* Message colors */
  --ai-demo-user-bg: #2f2f2f;              // User message background
  --ai-demo-ai-bg: transparent;             // AI message background

  /* Accent colors */
  --ai-demo-accent: #10a37f;               // ChatGPT green
  --ai-demo-accent-hover: #0d8968;

  /* Font */
  --ai-demo-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
}
```

---

## Component Details

### 1. **AIChatApp.tsx** (replaces most of Root.tsx logic)
- Sets up `Chat` provider with `isMessageAIGenerated`
- Manages sidebar collapse state
- Renders `Sidebar` + `ChatContainer`
- Layout: CSS Grid with collapsible sidebar

### 2. **Sidebar**
- Dark sidebar (`--ai-demo-bg-secondary`)
- Contains `SidebarHeader` (New Chat button) + `ChannelList`
- Mobile: Overlay with backdrop, toggle via hamburger
- Width: 260px (desktop), full-width overlay (mobile)

### 3. **SidebarHeader**
- "New Chat" button (+ icon)
- Creates new channel with `ai-${nanoId()}` pattern
- Styled as outlined button with hover effect

### 4. **ChannelPreviewItem**
- Shows `channel.data?.summary ?? channel.id`
- Hover background: `--ai-demo-bg-tertiary`
- Active state: subtle left border accent
- Truncate long text with ellipsis

### 5. **ChatContainer**
- Wraps `Channel` component
- Contains `Window` with `MessageList`, `AIStateIndicator`, `MessageInputBar`
- Max-width: 900px, centered

### 6. **MessageBubble**
- User messages: right-aligned with `--ai-demo-user-bg`
- AI messages: left-aligned, no background, full-width
- Padding: 16px 20px
- Border-radius: 12px (user), 0 (AI)
- Avatar removed (ChatGPT doesn't show avatars in main view)

### 7. **MessageInputBar**
- Wraps `AIMessageComposer`
- Rounded input box (24px border-radius)
- Model dropdown above input (subtle styling)
- Bottom padding: 24px
- Max-width: 740px

### 8. **EmptyState**
- Centered content with ChatGPT logo/branding area
- Auto-creates channel (existing behavior preserved)
- Subtle welcome text

---

## Stream Chat React CSS Variable Overrides

Add to `ai-demo.scss`:
```scss
:root {
  /* Override Stream Chat React variables */
  --str-chat__primary-color: var(--ai-demo-accent);
  --str-chat__background-color: var(--ai-demo-bg-primary);
  --str-chat__secondary-background-color: var(--ai-demo-bg-secondary);
  --str-chat__border-color: var(--ai-demo-border);
  --str-chat__text-color: var(--ai-demo-text-primary);
  --str-chat__text-low-emphasis-color: var(--ai-demo-text-secondary);

  /* Channel list overrides */
  --str-chat__channel-preview-hover-background: var(--ai-demo-bg-tertiary);
  --str-chat__channel-preview-active-background: var(--ai-demo-bg-tertiary);

  /* Message overrides */
  --str-chat__message-bubble-color: var(--ai-demo-user-bg);
  --str-chat__font-family: var(--ai-demo-font-family);
}
```

---

## Mobile Responsiveness

**Breakpoint:** 768px

- Sidebar overlay with backdrop
- Hamburger menu button in top-left
- ChatContainer takes full width
- Input bar responsive padding

---

## File Breakdown Strategy

1. Extract `CustomPreview` → `ChannelPreviewItem.tsx`
2. Extract `InputComponent` → `MessageInputBar.tsx`
3. Extract `CustomMessage` → `MessageBubble.tsx`
4. Extract `EmptyPlaceholder` → `EmptyState.tsx`
5. Create new `Sidebar.tsx` wrapping `ChannelList`
6. Create new `SidebarHeader.tsx` with New Chat button
7. Create `ChatContainer.tsx` wrapping `Channel`
8. Create `AIChatApp.tsx` as main orchestrator
9. Simplify `Root.tsx` to just render `AIChatApp`

---

## SCSS Import Strategy

Each component imports its own SCSS:
```tsx
import './ComponentName.scss';
```

Global styles in `index.scss`:
- CSS variables
- CSS layers
- Reset styles

Component-specific overrides in `ai-demo.scss` (imported in `index.scss`).

---

## Questions Before Implementation

1. **Sidebar width:** lets use 260px (ChatGPT default)
2. **New Chat button behavior:** it should prompt for confirmation when there's unsent text in current channel
3. **Channel list ordering:** Keep current sort logic
4. **Scrollbar styling:** add custom scrollbar styles to match ChatGPT's minimal scrollbars
