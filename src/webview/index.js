import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import SettingsApp from './SettingsApp';
import './index.css';

// Acquire the VS Code API once at the top level
const vscode = window.acquireVsCodeApi();

// Determine which component to render based on the container element
const rootElement = document.getElementById('root');
const settingsElement = document.getElementById('settings-root');

console.log('Root element:', rootElement);
console.log('Settings element:', settingsElement);
console.log('VSCode API:', vscode);

if (settingsElement) {
  console.log('Rendering settings page');
  // Render settings app
  ReactDOM.render(
    <React.StrictMode>
      <SettingsApp vscode={vscode} />
    </React.StrictMode>,
    settingsElement
  );
} else if (rootElement) {
  console.log('Rendering main app');
  // Render main app
  ReactDOM.render(
    <React.StrictMode>
      <App vscode={vscode} />
    </React.StrictMode>,
    rootElement
  );
} else {
  console.error('No valid container element found');
}