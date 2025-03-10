import React, { useState, useEffect } from 'react';

const PromptManager = ({ prompts, onCopyToClipboard }) => {
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [variableValues, setVariableValues] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [compiledPrompt, setCompiledPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  // Reset selection when prompts change
  useEffect(() => {
    if (prompts.length > 0 && !selectedPrompt) {
      handleSelectPrompt(prompts[0]);
    }
  }, [prompts]);

  // Handle selecting a prompt
  const handleSelectPrompt = (prompt) => {
    setSelectedPrompt(prompt);

    // Initialize variable values
    const initialValues = {};
    Object.keys(prompt.variables).forEach(key => {
      initialValues[key] = '';
    });
    setVariableValues(initialValues);
    setCompiledPrompt('');
    setCopied(false);
  };

  // Handle variable input change
  const handleVariableChange = (key, value) => {
    setVariableValues({
      ...variableValues,
      [key]: value
    });
  };

  // Compile the prompt by replacing variables with values
  const compilePrompt = () => {
    let result = selectedPrompt.template;

    // Replace each variable placeholder with its value
    Object.keys(variableValues).forEach(key => {
      const regex = new RegExp(`{${key}}`, 'g');
      result = result.replace(regex, variableValues[key]);
    });

    setCompiledPrompt(result);
  };

  // Copy compiled prompt to clipboard
  const copyToClipboard = () => {
    onCopyToClipboard(compiledPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter prompts based on search term
  const filteredPrompts = prompts.filter(prompt =>
    prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prompt.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Check if all required variables are filled
  const areRequiredVariablesFilled = () => {
    if (!selectedPrompt) return false;

    return Object.entries(selectedPrompt.variables)
      .filter(([_, variable]) => variable.required)
      .every(([key]) => variableValues[key]?.trim());
  };

  // VS Code-specific styles to match the VS Code UI
  const vscodeStyles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      color: 'var(--vscode-foreground)',
      fontFamily: 'var(--vscode-font-family)',
      backgroundColor: 'var(--vscode-editor-background)'
    },
    header: {
      backgroundColor: 'var(--vscode-activityBar-background)',
      color: 'var(--vscode-activityBar-foreground)',
      padding: '10px',
      display: 'flex',
      alignItems: 'center'
    },
    main: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden'
    },
    sidebar: {
      width: '300px',
      borderRight: '1px solid var(--vscode-panel-border)',
      overflowY: 'auto',
      backgroundColor: 'var(--vscode-sideBar-background)'
    },
    content: {
      flex: 1,
      overflowY: 'auto',
      padding: '20px'
    },
    input: {
      width: '100%',
      padding: '6px',
      borderRadius: '3px',
      border: '1px solid var(--vscode-input-border)',
      backgroundColor: 'var(--vscode-input-background)',
      color: 'var(--vscode-input-foreground)',
      marginBottom: '10px'
    },
    promptItem: {
      padding: '8px',
      margin: '4px 0',
      cursor: 'pointer',
      borderRadius: '3px',
      transition: 'background-color 0.2s'
    },
    selectedPrompt: {
      backgroundColor: 'var(--vscode-list-activeSelectionBackground)',
      color: 'var(--vscode-list-activeSelectionForeground)'
    },
    button: {
      padding: '6px 12px',
      backgroundColor: 'var(--vscode-button-background)',
      color: 'var(--vscode-button-foreground)',
      border: 'none',
      borderRadius: '3px',
      cursor: 'pointer'
    },
    disabledButton: {
      backgroundColor: 'var(--vscode-button-secondaryBackground)',
      color: 'var(--vscode-button-secondaryForeground)',
      cursor: 'not-allowed'
    },
    tag: {
      fontSize: 'small',
      padding: '2px 6px',
      borderRadius: '10px',
      margin: '0 4px 4px 0',
      display: 'inline-block',
      backgroundColor: 'var(--vscode-badge-background)',
      color: 'var(--vscode-badge-foreground)'
    },
    patternTag: {
      backgroundColor: 'var(--vscode-activityBarBadge-background)',
      color: 'var(--vscode-activityBarBadge-foreground)'
    },
    card: {
      backgroundColor: 'var(--vscode-editor-background)',
      border: '1px solid var(--vscode-panel-border)',
      borderRadius: '3px',
      padding: '16px',
      marginBottom: '16px'
    },
    textarea: {
      width: '100%',
      padding: '6px',
      borderRadius: '3px',
      border: '1px solid var(--vscode-input-border)',
      backgroundColor: 'var(--vscode-input-background)',
      color: 'var(--vscode-input-foreground)',
      fontFamily: 'var(--vscode-editor-font-family)',
      resize: 'vertical'
    },
    codeBlock: {
      backgroundColor: 'var(--vscode-textCodeBlock-background)',
      fontFamily: 'var(--vscode-editor-font-family)',
      padding: '8px',
      borderRadius: '3px',
      overflowX: 'auto',
      whiteSpace: 'pre-wrap'
    }
  };

  return (
    <div style={vscodeStyles.container}>
      {/* Header */}
      <header style={vscodeStyles.header}>
        <h1 style={{ margin: 0, fontSize: '1.2rem' }}>Prompt Library</h1>
      </header>

      <div style={vscodeStyles.main}>
        {/* Sidebar with prompt list */}
        <div style={vscodeStyles.sidebar}>
          <div style={{ padding: '10px' }}>
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={vscodeStyles.input}
            />

            <button
              style={{
                ...vscodeStyles.button,
                marginBottom: '10px'
              }}
            >
              Add
            </button>
            <div></div>
            <button
              style={{
                ...vscodeStyles.button,
                marginBottom: '10px'
              }}
            >
              Edit
            </button>

            <div>
              {filteredPrompts.length > 0 ? (
                filteredPrompts.map(prompt => (
                  <div
                    key={prompt.id}
                    onClick={() => handleSelectPrompt(prompt)}
                    style={{
                      ...vscodeStyles.promptItem,
                      ...(selectedPrompt?.id === prompt.id ? vscodeStyles.selectedPrompt : {})
                    }}
                  >
                    <h3 style={{ margin: '0 0 4px' }}>{prompt.name}</h3>
                    <p style={{ margin: '0 0 6px', fontSize: 'small' }}>{prompt.description}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                      {prompt.tags && prompt.tags.map(tag => (
                        <span key={tag} style={vscodeStyles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: '4px' }}>
                      {prompt.patterns && prompt.patterns.map(pattern => (
                        <span key={pattern} style={{ ...vscodeStyles.tag, ...vscodeStyles.patternTag }}>
                          {pattern}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', padding: '10px', color: 'var(--vscode-descriptionForeground)' }}>
                  {prompts.length === 0 ? 'Loading prompts...' : 'No prompts found'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div style={vscodeStyles.content}>
          {selectedPrompt ? (
            <div>
              <div style={vscodeStyles.card}>
                <h2 style={{ margin: '0 0 10px' }}>{selectedPrompt.name}</h2>
                <p style={{ margin: '0 0 10px', color: 'var(--vscode-descriptionForeground)' }}>
                  {selectedPrompt.description}
                </p>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontSize: 'small', fontWeight: 'bold' }}>Patterns: </span>
                    {selectedPrompt.patterns && selectedPrompt.patterns.map(pattern => (
                      <span key={pattern} style={{ ...vscodeStyles.tag, ...vscodeStyles.patternTag, marginLeft: '4px' }}>
                        {pattern}
                      </span>
                    ))}
                  </div>
                  <div>
                    <span style={{ fontSize: 'small', fontWeight: 'bold' }}>Author: </span>
                    <span style={{ fontSize: 'small' }}>{selectedPrompt.author}</span>
                  </div>
                </div>

                <div style={{ marginBottom: '10px' }}>
                  <h3 style={{ margin: '0 0 6px' }}>Template:</h3>
                  <div style={vscodeStyles.codeBlock}>
                    {selectedPrompt.template}
                  </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ margin: '0 0 6px' }}>Fill in the variables:</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedPrompt.variables && Object.entries(selectedPrompt.variables).map(([key, variable]) => (
                      <div key={key}>
                        <label style={{ display: 'block', marginBottom: '4px' }}>
                          {key}
                          {variable.required && <span style={{ color: 'var(--vscode-errorForeground)' }}>*</span>}
                          <span style={{ color: 'var(--vscode-descriptionForeground)', marginLeft: '4px' }}>
                            ({variable.description})
                          </span>
                        </label>
                        {variable.type === 'number' ? (
                          <input
                            type="number"
                            value={variableValues[key] || ''}
                            onChange={(e) => handleVariableChange(key, e.target.value)}
                            style={vscodeStyles.input}
                            required={variable.required}
                          />
                        ) : (
                          <textarea
                            value={variableValues[key] || ''}
                            onChange={(e) => handleVariableChange(key, e.target.value)}
                            style={vscodeStyles.textarea}
                            rows={key === 'codeBlock' ? 5 : 2}
                            required={variable.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={compilePrompt}
                  disabled={!areRequiredVariablesFilled()}
                  style={{
                    ...vscodeStyles.button,
                    ...(areRequiredVariablesFilled() ? {} : vscodeStyles.disabledButton)
                  }}
                >
                  Generate Prompt
                </button>
              </div>

              {compiledPrompt && (
                <div style={vscodeStyles.card}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Complete Prompt:</h3>
                    <button
                      onClick={copyToClipboard}
                      style={vscodeStyles.button}
                    >
                      {copied ? 'Copied!' : 'Copy to clipboard'}
                    </button>
                  </div>
                  <div style={vscodeStyles.codeBlock}>
                    {compiledPrompt}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--vscode-descriptionForeground)'
            }}>
              <p>Select a prompt from the sidebar to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptManager;