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
1. **Extension Host** (`src/extension.js`) - Main VS Code integration
2. **Webview UI** (`src/webview/`) - React-based user interface  
3. **Storage Layer** (`src/promptStorage.js`) - JSON file-based persistence
4. **GitHub Service** (`src/githubService.js`) - GitHub API integration and authentication
5. **Data Templates** (`src/data/`) - Default prompt templates and patterns

### Build System
Uses **Webpack with dual configuration**:
- **Extension bundle**: Node.js target for VS Code extension host
- **Webview bundle**: Web target for React UI in webview
- Asset copying for data files to `dist/` directory

### Communication Pattern
- **Bidirectional messaging** between extension and webview using VS Code's webview API
- Structured command protocol: `{ command: string, ...data }`
- State synchronization for prompt data between components

## Key Technical Patterns

### Data Management
- **Local storage** via VS Code's `globalStoragePath`
- **JSON persistence** with atomic file operations
- **Default template loading** with runtime fallbacks
- **ID-based CRUD operations** with auto-increment IDs

### Template System
Templates use `{variableName}` placeholder syntax:
```javascript
{
  template: "Create a {language} function that {purpose}",
  variables: {
    language: { type: "string", required: true, description: "..." },
    purpose: { type: "string", required: true, description: "..." }
  }
}
```

### React Integration
- **VS Code API integration** via `acquireVsCodeApi()`
- **VS Code theming** using CSS custom properties (`var(--vscode-*)`)
- **Message handling** between React components and extension host
- **Inline styles** following VS Code UI patterns

### Extension Lifecycle
1. **Activation**: Commands and webview view provider registration
2. **Panel Management**: Singleton webview panel with reveal/create logic  
3. **Storage Initialization**: Ensures storage directory and default data
4. **Message Routing**: Command-based message handling system

## File Structure Significance

- `webpack.config.js` - **Critical**: Defines dual build system for extension + webview
- `src/extension.js` - Main entry point, handles VS Code integration and webview lifecycle
- `src/promptStorage.js` - **Data layer**: All CRUD operations and file I/O
- `src/webview/App.js` - **Message hub**: Handles VS Code API communication
- `src/webview/PromptManager.js` - **Main UI**: Core user interface logic
- `src/data/default_templates.json` - **Template definitions**: Rich metadata structure with governance

## Important Conventions

### Styling
- Use VS Code CSS variables for theming (`--vscode-foreground`, `--vscode-button-background`)
- Inline styles for React components to match VS Code patterns
- Responsive flex layouts for panel-based UI

### Error Handling
- Try-catch blocks with console logging for debugging
- VS Code user notifications for user-facing errors
- Graceful fallbacks for missing files/data

### Message Protocol
Extension ↔ Webview communication uses structured commands:
- `getPrompts` - Request all prompts
- `addPrompt` / `updatePrompt` / `deletePrompt` - CRUD operations
- `copyToClipboard` - System clipboard integration

## VS Code Integration Points

- **Activity Bar**: Custom view container with prompt library
- **Command Palette**: `prompt-manager.openPromptManager` and `prompt-manager.openSettings` commands
- **Webview Panel**: Custom React UI with messaging
- **Global Storage**: User prompt persistence
- **Configuration API**: VS Code settings for GitHub integration
- **Authentication API**: Built-in GitHub authentication provider
- **Clipboard API**: Copy-to-clipboard functionality

## Build Output Structure
```
dist/
├── extension.js     # Node.js extension bundle
├── webview.js       # React webview bundle  
└── data/           # Copied template files
```

The extension loads data files from the `dist/data/` directory at runtime, allowing for bundled defaults while supporting user customization.