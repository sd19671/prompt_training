import React, { useState, useEffect } from 'react';
import PromptManager from './PromptManager';

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

function App() {
  // State for prompts
  const [prompts, setPrompts] = useState([]);
  const [initialized, setInitialized] = useState(false);

  // Effect to load prompts when the component mounts
  useEffect(() => {
    if (!initialized) {
      console.log('Requesting prompts from extension');
      // Request prompts data from the extension
      vscode.postMessage({
        command: 'getPrompts'
      });
      setInitialized(true);
    }

    // Set up message listener
    const messageListener = event => {
      const message = event.data;
      console.log('Received message:', message.command);
      
      switch (message.command) {
        case 'setPrompts':
          // console.log('Prompts received:', message.prompts.length);
          setPrompts(message.prompts);
          break;
        case 'promptAdded':
          setPrompts(prevPrompts => [...prevPrompts, message.prompt]);
          break;
        case 'promptUpdated':
          setPrompts(prevPrompts => 
            prevPrompts.map(p => p.id === message.prompt.id ? message.prompt : p)
          );
          break;
        case 'promptDeleted':
          setPrompts(prevPrompts => 
            prevPrompts.filter(p => p.id !== message.id)
          );
          break;
      }
    };

    window.addEventListener('message', messageListener);
    return () => window.removeEventListener('message', messageListener);
  }, [initialized]);

  // Function to handle copying to clipboard through VS Code API
  const handleCopyToClipboard = (text) => {
    vscode.postMessage({
      command: 'copyToClipboard',
      text
    });
  };

  return (
    <PromptManager 
      prompts={prompts} 
      onCopyToClipboard={handleCopyToClipboard}
    />
  );
}

export default App;