# Pixel Police - Design Perfection Enforcer

**The pixel-perfect police force that catches UI crimes!**

A Chrome extension for automatic validation of web interfaces against design systems. Catches spacing violations, sizing crimes, color offenses, and responsive design infractions.

## Purpose

The extension addresses key pain points for UI/UX developers and QA engineers:

- **Manual inspection time**: automatically detects spacing, sizing, and color inconsistencies
- **Hard-to-spot discrepancies**: built-in design system rules
- **Lack of standardization**: systematic approach to UI validation

## Architecture

The project follows **Clean Architecture** with clear layer separation:

### Domain
Pure business logic, independent of Chrome APIs:
- `ElementInspector` - individual element analysis
- `ResponsiveChecker` - responsiveness validation
- `ElementComparator` - element comparison
- `DesignRules` - design system rules

### Application
Use cases orchestrating domain and infrastructure:
- `InspectElementUseCase` - element inspection
- `CheckResponsiveUseCase` - responsive checks
- `CompareElementsUseCase` - element comparison
- `GenerateReportUseCase` - report generation

### Infrastructure
Adapters for external dependencies:
- `TabAdapter` - Chrome tab operations
- `StorageAdapter` - settings persistence
- `ScriptingAdapter` - script execution
- `ElementInspector` - DOM manipulation

### Presentation
UI components:
- `Popup` - main extension window
- `Overlay` - visual element overlays
- `Options` - settings page

## Security and Permissions

### Minimal permission set:
```json
{
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ]
}
```

### Security principles:
- **Least privilege**: only necessary permissions
- **Read-only mode**: the extension does not modify page content
- **Isolation**: content scripts run in an isolated world
- **Data validation**: all inputs are validated
- **CSP compliance**: code follows Content Security Policy

## Features

### 1. Element Inspection
- Hover over an element to see a box-model overlay
- Display numeric margin/padding/size values
- Warnings for design system violations

### 2. Design System Rules
- Configurable spacing grid (4px/8px/16px...)
- Minimum clickable element sizes (44px)
- Color palette validation
- Responsive breakpoints

### 3. Responsive Checks
- Screen size simulation
- Automatic overflow detection
- Mobile accessibility validation

### 4. Element Comparison
- Spacing consistency between buttons
- Uniform sizes for similar components
- Group analysis

### 5. Reports
- JSON/HTML/Markdown export
- Screenshots of problem areas
- Jira/Linear integration

## Installation and Development

```bash
# Clone
git clone <repository>
cd ui-inspector

# Install dependencies
npm install

# Build
npm run build

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable "Developer mode"
# 3. "Load unpacked" -> select dist/
```

## User Scenarios

### Scenario 1: Quick Inspection
1. Open a page
2. Click the extension icon
3. Enable "Inspect mode"
4. Hover over an element
5. See overlay + warnings

### Scenario 2: Responsive Check
1. Select breakpoint "Mobile 375px"
2. Extension simulates the size
3. Highlights problems
4. Generates a report

### Scenario 3: Team Workflow
1. QA finds issues
2. Generates a bug report
3. Copies description for Jira
4. Designer/developer gets clear specs

## Technical Details

### Message Passing
```typescript
interface Message<T> {
  type: MessageType;
  payload: T;
  source: 'popup' | 'content' | 'background';
  target: 'popup' | 'content' | 'background';
}
```

### Service Worker (Manifest V3)
- Background script as a service worker
- Wake/sleep handling
- State stored in chrome.storage

### Content Scripts
- Minimal footprint (DOM operations only)
- Business logic in separate layers
- Read-only page access

## Keyboard Shortcuts

| Action | Windows/Linux | macOS |
|--------|--------------|-------|
| Toggle inspect mode | `Ctrl+Shift+I` | `Cmd+Shift+I` |
| Generate report | `Ctrl+Shift+R` | `Cmd+Shift+R` |

## UI/UX Principles

- **Minimalist interface**: toggle on/off, modes, hotkeys
- **Performance**: does not slow down the page
- **Accessibility**: works on all websites
- **Localization**: i18n support

## Roadmap

- [ ] Figma integration
- [ ] Custom design system rules
- [ ] Automated testing
- [ ] CI/CD pipeline
- [ ] Performance monitoring

## Tech Debt

- [ ] Full type coverage
- [ ] Unit/integration tests
- [ ] E2E tests
- [ ] Documentation
- [ ] Performance optimization

## License

MIT License - see [LICENSE](LICENSE) file.

## Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push and open a PR
5. Code review and merge
