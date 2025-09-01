# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Build Commands:**
- `npm run webpack-dev` - Development build with watch mode (use during active development)
- `npm run webpack` - Single development build
- `npm run package` - Production build with source maps
- `npm run lint` - Run ESLint on JavaScript files
- `npm run test-compile` - Verify TypeScript compilation

**Testing the Extension:**
- Press F5 in VS Code to launch Extension Development Host
- Use Ctrl+Shift+P and type "Open Prompt Manager" to test functionality
- Use Ctrl+Shift+P and type "Open Prompt Manager Settings" to test configuration

## Architecture Overview

This is a VS Code extension with a **dual-bundle architecture**:

### Core Components
1. **Extension Host** (`src/extension.js`) - Main VS Code integration with two webview panels
2. **Webview UI** (`src/webview/`) - React-based user interface with dual-mode rendering
3. **Storage Layer** (`src/promptStorage.js`) - JSON file-based persistence with default template loading
4. **GitHub Service** (`src/githubService.js`) - GitHub API integration and authentication
5. **Data Templates** (`src/data/`) - Default prompt templates with rich metadata and governance

### Build System
Uses **Webpack with dual configuration**:
- **Extension bundle**: Node.js target for VS Code extension host
- **Webview bundle**: Web target for React UI in webview (shared by both panels)
- **Asset copying** for data files from `src/data/` to `dist/data/`

### Communication Pattern
- **Bidirectional messaging** between extension and webview using VS Code's webview API
- **Structured command protocol**: `{ command: string, ...data }`
- **State synchronization** for prompt data between components
- **Panel-specific routing** for main manager vs settings panels

## Key Technical Patterns

### Data Management
- **Local storage** via VS Code's `globalStoragePath` (user prompts stored in prompts.json)
- **Default template loading** from `dist/data/default_templates.json` with runtime fallbacks
- **ID-based CRUD operations** with auto-increment IDs for user prompts
- **Rich template metadata** including patterns, tags, governance, and compatibility info

### Template System
Templates use `{variableName}` placeholder syntax with rich variable definitions:
```javascript
{
  template: "Create a {language} function that {purpose}",
  variables: {
    language: { type: "string", required: true, description: "..." },
    purpose: { type: "string", required: true, description: "..." }
  },
  patterns: ["Output Automater", "Template"],
  tags: ["development", "code-generation"],
  governance: { canModify: "team", approvalRequirements: "..." }
}
```

### React Integration
- **Dual-mode rendering** in `src/webview/index.js` - renders different apps based on container element
- **VS Code API integration** via `acquireVsCodeApi()` passed as prop
- **VS Code theming** using CSS custom properties (`var(--vscode-*)`)
- **Message handling** between React components and extension host
- **Inline styles** following VS Code UI patterns for consistency

### Extension Lifecycle
1. **Activation**: Commands and webview view provider registration
2. **Panel Management**: Singleton webview panels (PromptManagerPanel, SettingsPanel) with reveal/create logic
3. **Storage Initialization**: Ensures storage directory and loads default templates
4. **Message Routing**: Command-based message handling with panel-specific handlers

## File Structure Significance

- `webpack.config.js` - **Critical**: Defines dual build system (extension + webview bundles)
- `src/extension.js` - Main entry point with two panel classes and VS Code integration
- `src/promptStorage.js` - **Data layer**: CRUD operations, file I/O, and default template loading
- `src/githubService.js` - **GitHub integration**: Authentication, repository operations, connection testing
- `src/webview/App.js` - **Main app**: Message handling and state management for prompt manager
- `src/webview/SettingsApp.js` - **Settings app**: Configuration UI for GitHub integration
- `src/webview/PromptManager.js` - **Main UI**: Core prompt management interface
- `src/webview/index.js` - **Entry point**: Dual-mode rendering logic
- `src/data/default_templates.json` - **Template definitions**: Rich metadata with patterns, governance, compatibility

## Important Conventions

### Styling
- Use VS Code CSS variables for theming (`--vscode-foreground`, `--vscode-button-background`)
- Inline styles for React components to match VS Code patterns
- Responsive flex layouts for panel-based UI
- Tag styling with pattern vs regular tag differentiation

### Error Handling
- Try-catch blocks with console logging for debugging
- VS Code user notifications (`showInformationMessage`, `showErrorMessage`) for user feedback
- Graceful fallbacks for missing files/data (defaults to empty arrays or default templates)

### Message Protocol
Extension ↔ Webview communication uses structured commands:

**Main Panel Commands:**
- `getPrompts` - Request all prompts
- `addPrompt` / `updatePrompt` / `deletePrompt` - CRUD operations
- `copyToClipboard` - System clipboard integration
- `openSettings` - Open settings panel

**Settings Panel Commands:**
- `getConfiguration` - Load VS Code settings
- `saveConfiguration` - Save settings to VS Code configuration
- `checkGitHubAuth` / `authenticateGitHub` - GitHub authentication
- `testGitHubConnection` - Test repository connectivity

## VS Code Integration Points

- **Activity Bar**: Custom view container (`prompt-manager`) with prompt library view
- **Commands**: `prompt-manager.openPromptManager` and `prompt-manager.openSettings`
- **Configuration**: Settings for GitHub integration (repository, branch, path, data source type)
- **Webview Panels**: Custom React UI with CSP and nonce security
- **Global Storage**: User prompt persistence in extension's global storage path
- **Authentication API**: Built-in GitHub authentication provider with repo scope
- **Clipboard API**: Copy-to-clipboard functionality

## Build Output Structure
```
dist/
├── extension.js     # Node.js extension bundle
├── webview.js       # React webview bundle (shared by both panels)
└── data/           # Copied template files
    ├── default_templates.json
    └── prompt_patterns.json
```

The extension loads data files from the `dist/data/` directory at runtime, enabling bundled defaults while supporting user customization and GitHub synchronization.