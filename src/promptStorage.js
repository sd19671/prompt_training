const vscode = require('vscode');
const path = require('path');
const fs = require('fs');

// Sample prompt data used as default if no storage exists yet
const defaultPrompts = [
  {
    "id": 1,
    "name": "sql-query-generator",
    "description": "Generates SQL queries based on natural language input",
    "version": "1.0.0",
    "template": "Write a SQL query that {action} from the {tableName} table. The query should {requirements}",
    "variables": {
      "action": {
        "type": "string",
        "description": "The main query action (select, update, delete)",
        "required": true
      },
      "tableName": {
        "type": "string",
        "description": "Target database table name",
        "required": true
      },
      "requirements": {
        "type": "string",
        "description": "Specific query requirements",
        "required": true
      }
    },
    "patterns": ["Output Automater"],
    "tags": ["database", "sql", "query"],
    "author": "data-team",
    "lastModified": "2024-02-07"
  },
  {
    "id": 2,
    "name": "code-reviewer",
    "description": "Reviews code changes and provides feedback",
    "version": "1.0.0",
    "template": "Review this {language} code for {focusAreas}:\n\n```{language}\n{codeBlock}\n```",
    "variables": {
      "language": {
        "type": "string",
        "description": "Programming language",
        "required": true
      },
      "focusAreas": {
        "type": "string",
        "description": "Specific areas to review (security, performance, style)",
        "required": true
      },
      "codeBlock": {
        "type": "string",
        "description": "Code to review",
        "required": true
      }
    },
    "patterns": ["Persona"],
    "tags": ["code-review", "security", "quality"],
    "author": "security-team",
    "lastModified": "2024-02-07"
  },
  {
    "id": 3,
    "name": "financial-report-analyzer",
    "description": "Analyzes financial statements and provides insights",
    "version": "1.0.0",
    "template": "Analyze the following {reportType} financial metrics: {metrics}. Focus on {analysisType} with a threshold of {threshold}%",
    "variables": {
      "reportType": {
        "type": "string",
        "description": "Type of financial report",
        "required": true
      },
      "metrics": {
        "type": "string",
        "description": "List of metrics to analyze",
        "required": true
      },
      "analysisType": {
        "type": "string",
        "description": "Type of analysis required",
        "required": true
      },
      "threshold": {
        "type": "number",
        "description": "Analysis threshold percentage",
        "required": true
      }
    },
    "patterns": ["Template", "Meta Language Creation"],
    "tags": ["finance", "analysis", "reporting"],
    "author": "finance-team",
    "lastModified": "2024-02-07"
  },
  {
    "id": 4,
    "name": "api-doc-generator",
    "description": "Generates API documentation from code",
    "version": "1.0.0",
    "template": "Create {format} documentation for this {apiType} API endpoint:\n\n{endpoint}\n\nInclude {docRequirements}",
    "variables": {
      "format": {
        "type": "string",
        "description": "Documentation format (OpenAPI, Markdown)",
        "required": true
      },
      "apiType": {
        "type": "string",
        "description": "Type of API (REST, GraphQL)",
        "required": true
      },
      "endpoint": {
        "type": "string",
        "description": "API endpoint code",
        "required": true
      },
      "docRequirements": {
        "type": "string",
        "description": "Specific documentation requirements",
        "required": false
      }
    },
    "patterns": ["Output Automater", "Template"],
    "tags": ["api", "documentation", "development"],
    "author": "dev-team",
    "lastModified": "2024-02-07"
  },
  {
    "id": 5,
    "name": "risk-assessor",
    "description": "Assesses operational risks in financial processes",
    "version": "1.0.0",
    "template": "Evaluate the {riskType} risks for process: {process}. Consider compliance with {regulations} and impact level {impactLevel}",
    "variables": {
      "riskType": {
        "type": "string",
        "description": "Type of risk to assess",
        "required": true
      },
      "process": {
        "type": "string",
        "description": "Process to evaluate",
        "required": true
      },
      "regulations": {
        "type": "string",
        "description": "Applicable regulations",
        "required": true
      },
      "impactLevel": {
        "type": "number",
        "description": "Impact level (1-5)",
        "required": true
      }
    },
    "patterns": ["Recipe", "Template"],
    "tags": ["risk", "compliance", "finance"],
    "author": "risk-team",
    "lastModified": "2024-02-07"
  }
];

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

  /**
   * Gets all stored prompts
   */
  getPrompts() {
    console.log('Reading prompts from:', this.promptsFilePath);
    try {
      if (fs.existsSync(this.promptsFilePath)) {
        const data = fs.readFileSync(this.promptsFilePath, 'utf8');
        return JSON.parse(data);
      } else {
        // Initialize with default prompts if file doesn't exist
        this.savePrompts(defaultPrompts);
        return defaultPrompts;
      }
    } catch (error) {
      console.error('Error reading prompts file:', error);
      // Return default prompts if there's an error reading the file
      return defaultPrompts;
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