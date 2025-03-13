const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
// const { get } = require('http');

// Sample prompt data used as default if no storage exists yet
const defaultTemplatesPath = path.join(__dirname, 'data', 'default_templates.json');
const defaultPrompts = [];

/**
 * Manages prompt storage and loading
 */
class PromptStorage {
  constructor(context) {
    this.storagePath = context.globalStoragePath;
    this.promptsFilePath = path.join(this.storagePath, 'prompts.json');
    this.ensureStorageExists();
  }

  /**
   * Ensures the storage directory exists
   */
  ensureStorageExists() {
    if (!fs.existsSync(this.storagePath)) {
      fs.mkdirSync(this.storagePath, { recursive: true });
    }
  }

  getDefaultPrompts() {
    try {
      if (fs.existsSync(defaultTemplatesPath)) {
        const data = fs.readFileSync(defaultTemplatesPath, 'utf8');
        return JSON.parse(data);
      } else {
        console.error('Default prompts file not found:', defaultTemplatesPath);
        return defaultPrompts;
      }
    } catch (error) {
      console.error('Error reading default prompts file:', error);
      return defaultPrompts;
    }
  }

  /**
   * Gets all stored prompts
   */
  getPrompts() {
    console.log('Reading prompts from:', this.promptsFilePath);
    try {
      if (fs.existsSync(this.promptsFilePath)) {
        const data = fs.readFileSync(this.promptsFilePath, 'utf8');
        console.log('Read prompts:', JSON.parse(data));
        return JSON.parse(data);
      } else {
        // Initialize with default prompts if file doesn't exist
        const defaultPrompts = this.getDefaultPrompts();
        this.savePrompts(defaultPrompts);
        return defaultPrompts;
      }
    } catch (error) {
      console.error('Error reading prompts file:', error);
      // Return default prompts if there's an error reading the file
      return this.getDefaultPrompts();
    }
  }

  /**
   * Saves prompts to storage
   * @param {Array} prompts - Array of prompt objects
   */
  savePrompts(prompts) {
    try {
      fs.writeFileSync(this.promptsFilePath, JSON.stringify(prompts, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving prompts file:', error);
      return false;
    }
  }

  /**
   * Adds a new prompt to storage
   * @param {Object} prompt - Prompt object
   */
  addPrompt(prompt) {
    const prompts = this.getPrompts();
    // Generate a new ID (max ID + 1)
    const newId = Math.max(...prompts.map(p => p.id), 0) + 1;
    const newPrompt = {
      ...prompt,
      id: newId,
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    prompts.push(newPrompt);
    return this.savePrompts(prompts) ? newPrompt : null;
  }

  /**
   * Updates an existing prompt
   * @param {Number} id - ID of the prompt to update
   * @param {Object} updatedPrompt - Updated prompt data
   */
  updatePrompt(id, updatedPrompt) {
    const prompts = this.getPrompts();
    const index = prompts.findIndex(p => p.id === id);
    
    if (index === -1) {
      return null;
    }
    
    prompts[index] = {
      ...updatedPrompt,
      id: id,
      lastModified: new Date().toISOString().split('T')[0]
    };
    
    return this.savePrompts(prompts) ? prompts[index] : null;
  }

  /**
   * Deletes a prompt
   * @param {Number} id - ID of the prompt to delete
   */
  deletePrompt(id) {
    const prompts = this.getPrompts();
    const filteredPrompts = prompts.filter(p => p.id !== id);
    
    if (filteredPrompts.length === prompts.length) {
      return false; // No prompt was deleted
    }
    
    return this.savePrompts(filteredPrompts);
  }
}

module.exports = PromptStorage;