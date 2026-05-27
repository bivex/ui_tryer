# Pixel Police

**Catch UI crimes before they hit production.**

Pixel Police is a Chrome extension that automatically validates your web UI against a design system. Spacing off by 2px? Font size doesn't match? Button too small to tap? You're busted.

## What it does

- **Inspects elements** — hover over anything and see its box model, spacing, sizing, and any design system violations
- **Checks responsive** — simulate screen sizes, catch overflow issues, flag mobile problems
- **Compares elements** — find inconsistent spacing, mismatched button sizes, uneven layouts
- **Generates reports** — export findings as JSON, HTML, or Markdown with screenshots

## Quick start

```bash
git clone <repository>
cd ui-inspector
npm install
npm run build
```

Then load it in Chrome:

1. Go to `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `dist/` folder

## How it works

Point at an element. See everything wrong with it. That's it.

Hit the extension icon to toggle inspect mode, then move your mouse around the page. Overlays show up with box model details and warnings when something violates the design system rules.

**Keyboard shortcuts:**

| Action | Windows/Linux | macOS |
|--------|--------------|-------|
| Toggle inspect | `Ctrl+Shift+I` | `Cmd+Shift+I` |
| Generate report | `Ctrl+Shift+R` | `Cmd+Shift+R` |

## Design system rules

Pixel Police checks against configurable rules:

- **Spacing grid** — 4px, 8px, 16px increments (customize to your system)
- **Minimum tap targets** — flags elements smaller than 44px
- **Color palette** — catches colors outside your defined palette
- **Breakpoints** — validates responsive behavior at standard breakpoints

## Architecture

Built with clean architecture — domain logic has zero Chrome API dependencies, so it's testable and portable.

```
src/
  domain/          # Pure business logic (no Chrome deps)
  application/     # Use cases orchestrating domain + infra
  infrastructure/  # Chrome API adapters
  presentation/    # Popup, overlay, options UI
  content/         # Content script (DOM operations)
  background/      # Service worker (Manifest V3)
```

### Message passing

All communication between popup, content script, and background uses typed messages:

```typescript
interface Message<T> {
  type: MessageType;
  payload: T;
  source: 'popup' | 'content' | 'background';
  target: 'popup' | 'content' | 'background';
}
```

## Security

- Read-only — never modifies page content
- Minimal permissions (`activeTab`, `storage`, `scripting`)
- Content scripts run in isolated world
- CSP compliant

## Development

```bash
npm run dev          # Build in watch mode
npm run lint         # Check code style
npm run lint:fix     # Fix code style
npm run type-check   # TypeScript validation
npm run test         # Run tests
npm run test:watch   # Run tests in watch mode
```

## Roadmap

- Figma integration
- Custom design system rules editor
- CI/CD pipeline
- Performance monitoring

## License

MIT
