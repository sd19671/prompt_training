# Prompt Manager VS Code Extension

A VS Code extension for managing prompt templates for AI interactions.

## Features

- Browse and search through your prompt templates
- Edit and create prompt templates with variables
- Generate customized prompts by filling in the variables
- Copy generated prompts to clipboard for use with AI systems
- Store templates locally for easy access

## Usage

1. Open the Prompt Manager by clicking the command palette (Ctrl+Shift+P) and typing "Open Prompt Manager"
2. Browse the templates in the sidebar and select one to work with
3. Fill in the variable fields for your selected template
4. Click "Generate Prompt" to create your customized prompt
5. Use the "Copy to clipboard" button to copy the generated prompt

## Setup and Development

### Prerequisites

- Node.js and npm

### Installation

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm run webpack` to build the extension
4. Press F5 to start debugging the extension in a new VS Code window

### Building the Extension

To build the VSIX package for distribution:

1. Install the VS Code Extension CLI: `npm install -g @vscode/vsce`
2. Run `vsce package` to create a .vsix file
3. Install the extension by running `code --install-extension prompt-manager-0.1.0.vsix`

## Project Structure

- `src/extension.js`: Main extension code
- `src/promptStorage.js`: Manages storage of prompt templates
- `src/webview/`: React components for the webview UI
  - `index.js`: Entry point for the React app
  - `App.js`: Main React component with VS Code messaging
  - `PromptManager.js`: UI for managing prompts
- `dist/`: Built files (generated)

## Extension Settings

This extension contributes the following commands:

* `prompt-manager.openPromptManager`: Opens the Prompt Manager panel

## Release Notes

### 0.1.0

Initial release of the Prompt Manager VS Code Extension.
