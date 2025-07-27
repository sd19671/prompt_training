import React, { useState, useEffect } from 'react';
import ConfigurationPage from './ConfigurationPage';

function SettingsApp({ vscode }) {
  const [config, setConfig] = useState({
    dataSourceType: 'local',
    githubRepository: '',
    githubBranch: 'main',
    githubPath: 'prompts'
  });
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Effect to load configuration when the component mounts
  useEffect(() => {
    if (!initialized && vscode) {
      console.log('Requesting configuration from extension');
      // Request configuration from the extension
      vscode.postMessage({ command: 'getConfiguration' });
      vscode.postMessage({ command: 'checkGitHubAuth' });
      setInitialized(true);
    }

    // Set up message listener
    const messageListener = event => {
      const message = event.data;
      console.log('Settings received message:', message.command);
      
      switch (message.command) {
        case 'configurationLoaded':
          setConfig(message.config);
          break;
        case 'githubAuthStatus':
          setIsAuthenticated(message.isAuthenticated);
          break;
      }
    };

    window.addEventListener('message', messageListener);
    return () => window.removeEventListener('message', messageListener);
  }, [initialized, vscode]);

  // Function to handle saving configuration
  const handleSaveConfiguration = (newConfig) => {
    if (vscode) {
      vscode.postMessage({
        command: 'saveConfiguration',
        config: newConfig
      });
    }
    setConfig(newConfig);
  };

  // Function to handle GitHub authentication
  const handleGitHubAuth = () => {
    if (vscode) {
      vscode.postMessage({ command: 'authenticateGitHub' });
    }
  };

  // Function to handle connection testing
  const handleTestConnection = (repository, branch, path) => {
    if (vscode) {
      vscode.postMessage({
        command: 'testGitHubConnection',
        repository,
        branch,
        path
      });
    }
  };

  return (
    <ConfigurationPage 
      config={config}
      isAuthenticated={isAuthenticated}
      onSaveConfiguration={handleSaveConfiguration}
      onGitHubAuth={handleGitHubAuth}
      onTestConnection={handleTestConnection}
    />
  );
}

export default SettingsApp;