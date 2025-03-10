const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const PromptStorage = require('./promptStorage');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Prompt Manager is now active!');

  // Initialize the prompt storage
  const promptStorage = new PromptStorage(context);

  // Register the command to open the prompt manager
  let disposable = vscode.commands.registerCommand('prompt-manager.openPromptManager', () => {
    PromptManagerPanel.createOrShow(context.extensionUri, promptStorage);
  });

  context.subscriptions.push(disposable);

  vscode.window.registerWebviewViewProvider('promptLibrary', {
    resolveWebviewView(webviewView) {
      webviewView.webview.options = {
        enableScripts: true
      };

      webviewView.webview.onDidReceiveMessage(message => {
        console.log('Received message:', message.command);
        switch (message.command) {
          case 'getPrompts':
            const prompts = promptStorage.getPrompts();
            webviewView.webview.postMessage({ command: 'setPrompts', prompts });
            break;
          // Handle other commands
        }
      });
    }
  });
}

/**
 * Manages the webview panel for the Prompt Manager
 */
class PromptManagerPanel {
  static currentPanel = undefined;
  static viewType = 'promptManager';

  constructor(panel, extensionUri, promptStorage) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.promptStorage = promptStorage;
    this._disposables = [];

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this.panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    this.panel.onDidChangeViewState(
      e => {
        if (this.panel.visible) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(
      message => {
        switch (message.command) {
          case 'getPrompts':
            const prompts = this.promptStorage.getPrompts();
            // console.log('Sending prompts:', prompts);
            this.panel.webview.postMessage({
              command: 'setPrompts',
              prompts
            });
            vscode.window.showInformationMessage('Prompts set successfully!');
            return;
          case 'addPrompt':
            const newPrompt = this.promptStorage.addPrompt(message.prompt);
            if (newPrompt) {
              this.panel.webview.postMessage({
                command: 'promptAdded',
                prompt: newPrompt
              });
              vscode.window.showInformationMessage('Prompt added successfully!');
            }
            return;
          case 'updatePrompt':
            const updatedPrompt = this.promptStorage.updatePrompt(message.id, message.prompt);
            if (updatedPrompt) {
              this.panel.webview.postMessage({
                command: 'promptUpdated',
                prompt: updatedPrompt
              });
              vscode.window.showInformationMessage('Prompt updated successfully!');
            }
            return;
          case 'deletePrompt':
            const deleted = this.promptStorage.deletePrompt(message.id);
            if (deleted) {
              this.panel.webview.postMessage({
                command: 'promptDeleted',
                id: message.id
              });
              vscode.window.showInformationMessage('Prompt deleted successfully!');
            }
            return;
          case 'copyToClipboard':
            vscode.env.clipboard.writeText(message.text);
            vscode.window.showInformationMessage('Prompt copied to clipboard!');
            return;
        }
      },
      null,
      this._disposables
    );
  }

  static createOrShow(extensionUri, promptStorage) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (PromptManagerPanel.currentPanel) {
      PromptManagerPanel.currentPanel.panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      PromptManagerPanel.viewType,
      'Prompt Manager',
      column || vscode.ViewColumn.One,
      {
        // Enable JavaScript in the webview
        enableScripts: true,
        // Restrict the webview to only load resources from our extension's directory
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist'),
          vscode.Uri.joinPath(extensionUri, 'media')
        ]
      }
    );

    PromptManagerPanel.currentPanel = new PromptManagerPanel(panel, extensionUri, promptStorage);
  }

  dispose() {
    PromptManagerPanel.currentPanel = undefined;

    // Clean up our resources
    this.panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  _update() {
    const webview = this.panel.webview;
    this.panel.title = "Momentum Prompt Trainer";
    this.panel.webview.html = this._getHtmlForWebview(webview);
  }

  _getHtmlForWebview(webview) {
    // Get the local path to script
    const scriptPathOnDisk = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.js');
    const scriptUri = webview.asWebviewUri(scriptPathOnDisk);

    // Use a nonce to allow only specific scripts to be run
    const nonce = getNonce();

    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <title>Momentum Prompt Trainer</title>
      </head>
      <body>
        <div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

function deactivate() {}

module.exports = {
  activate,
  deactivate
};