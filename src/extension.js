const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const PromptStorage = require('./promptStorage');
const GitHubService = require('./githubService');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Prompt Manager is now active!');

  // Initialize the prompt storage and GitHub service
  const promptStorage = new PromptStorage(context);
  const githubService = new GitHubService();

  // Register the command to open the prompt manager
  let disposable = vscode.commands.registerCommand('prompt-manager.openPromptManager', () => {
    PromptManagerPanel.createOrShow(context.extensionUri, promptStorage, githubService);
  });

  // Register the command to open settings
  let settingsDisposable = vscode.commands.registerCommand('prompt-manager.openSettings', () => {
    SettingsPanel.createOrShow(context.extensionUri, githubService);
  });

  context.subscriptions.push(disposable);
  context.subscriptions.push(settingsDisposable);

  vscode.window.registerWebviewViewProvider('promptLibrary', {
    resolveWebviewView(webviewView) {
      webviewView.webview.options = {
        enableScripts: true
      };

      webviewView.webview.onDidReceiveMessage(message => {
        // console.log('Received message:', message.command);
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

  constructor(panel, extensionUri, promptStorage, githubService) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.promptStorage = promptStorage;
    this.githubService = githubService;
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
          case 'openSettings':
            SettingsPanel.createOrShow(this.extensionUri, this.githubService);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  static createOrShow(extensionUri, promptStorage, githubService) {
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

    PromptManagerPanel.currentPanel = new PromptManagerPanel(panel, extensionUri, promptStorage, githubService);
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

/**
 * Manages the settings webview panel
 */
class SettingsPanel {
  static currentPanel = undefined;
  static viewType = 'promptManagerSettings';

  constructor(panel, extensionUri, githubService) {
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.githubService = githubService;
    this._disposables = [];

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
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
      async message => {
        switch (message.command) {
          case 'getConfiguration':
            await this._sendConfiguration();
            return;
          case 'saveConfiguration':
            await this._saveConfiguration(message.config);
            return;
          case 'checkGitHubAuth':
            await this._checkGitHubAuth();
            return;
          case 'authenticateGitHub':
            await this._authenticateGitHub();
            return;
          case 'testGitHubConnection':
            await this._testGitHubConnection(message.repository, message.branch, message.path);
            return;
        }
      },
      null,
      this._disposables
    );
  }

  static createOrShow(extensionUri, githubService) {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    // If we already have a panel, show it
    if (SettingsPanel.currentPanel) {
      SettingsPanel.currentPanel.panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      SettingsPanel.viewType,
      'Prompt Manager Settings',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'dist'),
          vscode.Uri.joinPath(extensionUri, 'media')
        ]
      }
    );

    SettingsPanel.currentPanel = new SettingsPanel(panel, extensionUri, githubService);
  }

  dispose() {
    SettingsPanel.currentPanel = undefined;
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
    this.panel.title = "Prompt Manager Settings";
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
        <title>Prompt Manager Settings</title>
      </head>
      <body>
        <div id="settings-root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
      </body>
      </html>`;
  }

  async _sendConfiguration() {
    const config = vscode.workspace.getConfiguration('promptManager');
    
    this.panel.webview.postMessage({
      command: 'configurationLoaded',
      config: {
        dataSourceType: config.get('dataSource.type', 'local'),
        githubRepository: config.get('github.repository', ''),
        githubBranch: config.get('github.branch', 'main'),
        githubPath: config.get('github.path', 'prompts')
      }
    });
  }

  async _saveConfiguration(config) {
    const workspaceConfig = vscode.workspace.getConfiguration('promptManager');
    
    await workspaceConfig.update('dataSource.type', config.dataSourceType, vscode.ConfigurationTarget.Global);
    await workspaceConfig.update('github.repository', config.githubRepository, vscode.ConfigurationTarget.Global);
    await workspaceConfig.update('github.branch', config.githubBranch, vscode.ConfigurationTarget.Global);
    await workspaceConfig.update('github.path', config.githubPath, vscode.ConfigurationTarget.Global);
    
    vscode.window.showInformationMessage('Configuration saved successfully!');
  }

  async _checkGitHubAuth() {
    const isAuthenticated = await this.githubService.isAuthenticated();
    
    this.panel.webview.postMessage({
      command: 'githubAuthStatus',
      isAuthenticated: isAuthenticated
    });
  }

  async _authenticateGitHub() {
    try {
      const success = await this.githubService.authenticate();
      
      if (success) {
        vscode.window.showInformationMessage('Successfully authenticated with GitHub!');
        this.panel.webview.postMessage({
          command: 'githubAuthStatus',
          isAuthenticated: true
        });
      } else {
        vscode.window.showErrorMessage('Failed to authenticate with GitHub.');
      }
    } catch (error) {
      console.error('GitHub authentication error:', error);
      vscode.window.showErrorMessage(`GitHub authentication failed: ${error.message}`);
    }
  }

  async _testGitHubConnection(repository, branch, path) {
    try {
      const result = await this.githubService.testConnection(repository, branch, path);
      
      this.panel.webview.postMessage({
        command: 'connectionTestResult',
        result: result.message
      });

      if (result.success) {
        vscode.window.showInformationMessage('GitHub connection test successful!');
      } else {
        vscode.window.showWarningMessage(`GitHub connection test failed: ${result.message}`);
      }
    } catch (error) {
      console.error('GitHub connection test error:', error);
      const errorMessage = `Connection test failed: ${error.message}`;
      
      this.panel.webview.postMessage({
        command: 'connectionTestResult',
        result: errorMessage
      });
      
      vscode.window.showErrorMessage(errorMessage);
    }
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