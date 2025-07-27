import React, { useState, useEffect } from 'react';

const ConfigurationPage = ({ 
  config, 
  isAuthenticated, 
  onSaveConfiguration, 
  onGitHubAuth, 
  onTestConnection 
}) => {
  const [localConfig, setLocalConfig] = useState(config);
  const [testStatus, setTestStatus] = useState('');
  const [testing, setTesting] = useState(false);

  // Update local config when props change
  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  // Listen for connection test results
  useEffect(() => {
    const messageListener = event => {
      const message = event.data;
      if (message.command === 'connectionTestResult') {
        setTestStatus(message.result);
        setTesting(false);
      }
    };

    window.addEventListener('message', messageListener);
    return () => window.removeEventListener('message', messageListener);
  }, []);

  const handleConfigChange = (key, value) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    onSaveConfiguration(newConfig);
  };

  const testGitHubConnection = () => {
    if (!localConfig.githubRepository) {
      setTestStatus('Please enter a repository name');
      return;
    }
    
    setTesting(true);
    setTestStatus('Testing connection...');
    onTestConnection(localConfig.githubRepository, localConfig.githubBranch, localConfig.githubPath);
  };

  // VS Code-specific styles
  const vscodeStyles = {
    container: {
      padding: '20px',
      color: 'var(--vscode-foreground)',
      fontFamily: 'var(--vscode-font-family)',
      backgroundColor: 'var(--vscode-editor-background)',
      height: '100vh',
      overflowY: 'auto'
    },
    section: {
      marginBottom: '30px',
      padding: '20px',
      backgroundColor: 'var(--vscode-editor-background)',
      border: '1px solid var(--vscode-panel-border)',
      borderRadius: '4px'
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: 'bold',
      marginBottom: '15px',
      color: 'var(--vscode-foreground)'
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontSize: '13px',
      color: 'var(--vscode-foreground)'
    },
    input: {
      width: '100%',
      padding: '8px',
      borderRadius: '3px',
      border: '1px solid var(--vscode-input-border)',
      backgroundColor: 'var(--vscode-input-background)',
      color: 'var(--vscode-input-foreground)',
      marginBottom: '15px',
      fontSize: '13px'
    },
    select: {
      width: '100%',
      padding: '8px',
      borderRadius: '3px',
      border: '1px solid var(--vscode-input-border)',
      backgroundColor: 'var(--vscode-dropdown-background)',
      color: 'var(--vscode-dropdown-foreground)',
      marginBottom: '15px',
      fontSize: '13px'
    },
    button: {
      padding: '8px 16px',
      backgroundColor: 'var(--vscode-button-background)',
      color: 'var(--vscode-button-foreground)',
      border: 'none',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '13px',
      marginRight: '10px'
    },
    secondaryButton: {
      padding: '8px 16px',
      backgroundColor: 'var(--vscode-button-secondaryBackground)',
      color: 'var(--vscode-button-secondaryForeground)',
      border: '1px solid var(--vscode-button-border)',
      borderRadius: '3px',
      cursor: 'pointer',
      fontSize: '13px',
      marginRight: '10px'
    },
    disabledButton: {
      backgroundColor: 'var(--vscode-button-secondaryBackground)',
      color: 'var(--vscode-descriptionForeground)',
      cursor: 'not-allowed'
    },
    statusMessage: {
      padding: '10px',
      marginTop: '10px',
      borderRadius: '3px',
      fontSize: '13px'
    },
    successStatus: {
      backgroundColor: 'var(--vscode-inputValidation-infoBackground)',
      color: 'var(--vscode-inputValidation-infoForeground)',
      border: '1px solid var(--vscode-inputValidation-infoBorder)'
    },
    errorStatus: {
      backgroundColor: 'var(--vscode-inputValidation-errorBackground)',
      color: 'var(--vscode-inputValidation-errorForeground)',
      border: '1px solid var(--vscode-inputValidation-errorBorder)'
    },
    infoStatus: {
      backgroundColor: 'var(--vscode-editor-inactiveSelectionBackground)',
      color: 'var(--vscode-foreground)',
      border: '1px solid var(--vscode-panel-border)'
    },
    authStatus: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '15px'
    },
    authIndicator: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      marginRight: '8px'
    },
    authenticated: {
      backgroundColor: 'var(--vscode-charts-green)'
    },
    notAuthenticated: {
      backgroundColor: 'var(--vscode-charts-red)'
    }
  };

  const getStatusStyle = () => {
    if (testStatus.includes('Success') || testStatus.includes('authenticated')) {
      return { ...vscodeStyles.statusMessage, ...vscodeStyles.successStatus };
    } else if (testStatus.includes('Error') || testStatus.includes('Failed')) {
      return { ...vscodeStyles.statusMessage, ...vscodeStyles.errorStatus };
    } else {
      return { ...vscodeStyles.statusMessage, ...vscodeStyles.infoStatus };
    }
  };

  return (
    <div style={vscodeStyles.container}>
      <h1 style={{ fontSize: '20px', marginBottom: '20px' }}>Prompt Manager Configuration</h1>
      
      {/* Data Source Configuration */}
      <div style={vscodeStyles.section}>
        <h2 style={vscodeStyles.sectionTitle}>Data Source</h2>
        
        <label style={vscodeStyles.label}>Data Source Type:</label>
        <select
          style={vscodeStyles.select}
          value={localConfig.dataSourceType || 'local'}
          onChange={(e) => handleConfigChange('dataSourceType', e.target.value)}
        >
          <option value="local">Local Storage</option>
          <option value="github">GitHub Repository</option>
        </select>
        
        <p style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)', margin: '0' }}>
          Choose where to store and sync your prompt templates.
        </p>
      </div>

      {/* GitHub Configuration */}
      {localConfig.dataSourceType === 'github' && (
        <div style={vscodeStyles.section}>
          <h2 style={vscodeStyles.sectionTitle}>GitHub Configuration</h2>
          
          {/* Authentication Status */}
          <div style={vscodeStyles.authStatus}>
            <div 
              style={{
                ...vscodeStyles.authIndicator,
                ...(isAuthenticated ? vscodeStyles.authenticated : vscodeStyles.notAuthenticated)
              }}
            ></div>
            <span style={{ fontSize: '13px' }}>
              {isAuthenticated ? 'Authenticated with GitHub' : 'Not authenticated with GitHub'}
            </span>
          </div>

          {!isAuthenticated && (
            <button 
              style={vscodeStyles.button}
              onClick={onGitHubAuth}
            >
              Authenticate with GitHub
            </button>
          )}
          
          <label style={vscodeStyles.label}>Repository (username/repo-name):</label>
          <input
            type="text"
            style={vscodeStyles.input}
            value={localConfig.githubRepository || ''}
            onChange={(e) => handleConfigChange('githubRepository', e.target.value)}
            placeholder="e.g., mycompany/prompt-library"
          />
          
          <label style={vscodeStyles.label}>Branch:</label>
          <input
            type="text"
            style={vscodeStyles.input}
            value={localConfig.githubBranch || 'main'}
            onChange={(e) => handleConfigChange('githubBranch', e.target.value)}
            placeholder="main"
          />
          
          <label style={vscodeStyles.label}>Path in Repository:</label>
          <input
            type="text"
            style={vscodeStyles.input}
            value={localConfig.githubPath || 'prompts'}
            onChange={(e) => handleConfigChange('githubPath', e.target.value)}
            placeholder="prompts"
          />
          
          <button
            style={{
              ...vscodeStyles.secondaryButton,
              ...(testing || !localConfig.githubRepository ? vscodeStyles.disabledButton : {})
            }}
            onClick={testGitHubConnection}
            disabled={testing || !localConfig.githubRepository}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          
          {testStatus && (
            <div style={getStatusStyle()}>
              {testStatus}
            </div>
          )}
          
          <p style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)', marginTop: '15px' }}>
            The repository will be used to store and sync your prompt templates. Make sure you have read/write access to the repository.
          </p>
        </div>
      )}

      {/* Information Section */}
      <div style={vscodeStyles.section}>
        <h2 style={vscodeStyles.sectionTitle}>About Data Sources</h2>
        
        <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Local Storage</h3>
        <p style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)', marginBottom: '15px' }}>
          Prompts are stored locally on your machine. This is the simplest option but doesn't allow sharing across devices or with team members.
        </p>
        
        <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>GitHub Repository</h3>
        <p style={{ fontSize: '12px', color: 'var(--vscode-descriptionForeground)', margin: '0' }}>
          Prompts are stored in a GitHub repository, enabling version control, sharing with team members, and synchronization across devices. Requires authentication with GitHub.
        </p>
      </div>
    </div>
  );
};

export default ConfigurationPage;