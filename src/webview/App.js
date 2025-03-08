import React, { useState, useEffect } from 'react';
import PromptManager from './PromptManager';

// Acquire the VS Code API
const vscode = acquireVsCodeApi();

function App() {
  // Set up initial state with persisted state if available
  const [state, setState] = useState(() => {
    const previousState = vscode.getState();
    return previousState || {
      prompts: [], // We'll load these from storage
    };
  });

  // Effect to load prompts when the component mounts
  useEffect(() => {
    // Send message to the extension to request prompts data
    vscode.postMessage({
      command: 'getPrompts'
    });

    // Set up message listener
    const messageListener = event => {
      const message = event.data;
      console.log('Message prompts:', message);
      switch (message.command) {
        case 'setPrompts':
          setState(prevState => ({
            ...prevState,
            prompts: message.prompts
          }));
          // Persist state
          vscode.setState({ prompts: message.prompts });
          break;
        case 'promptAdded':
          setState(prevState => {
            const updatedPrompts = [...prevState.prompts, message.prompt];
            vscode.setState({ prompts: updatedPrompts });
            return { ...prevState, prompts: updatedPrompts };
          });
          break;
        case 'promptUpdated':
          setState(prevState => {
            const updatedPrompts = prevState.prompts.map(p => 
              p.id === message.prompt.id ? message.prompt : p
            );
            vscode.setState({ prompts: updatedPrompts });
            return { ...prevState, prompts: updatedPrompts };
          });
          break;
        case 'promptDeleted':
          setState(prevState => {
            const updatedPrompts = prevState.prompts.filter(p => p.id !== message.id);
            vscode.setState({ prompts: updatedPrompts });
            return { ...prevState, prompts: updatedPrompts };
          });
          break;
        // Handle other message types
      }
    };

    window.addEventListener('message', messageListener);
    return () => window.removeEventListener('message', messageListener);
  }, []);

  // Function to handle copying to clipboard through VS Code API
  const handleCopyToClipboard = (text) => {
    vscode.postMessage({
      command: 'copyToClipboard',
      text
    });
  };

  return (
    <PromptManager 
      prompts={state.prompts} 
      onCopyToClipboard={handleCopyToClipboard}
    />
  );
}

export default App;