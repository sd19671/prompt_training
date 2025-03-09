/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./src/extension.js":
/*!**************************!*\
  !*** ./src/extension.js ***!
  \**************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var vscode = __webpack_require__(/*! vscode */ "vscode");
var path = __webpack_require__(/*! path */ "path");
var fs = __webpack_require__(/*! fs */ "fs");
var PromptStorage = __webpack_require__(/*! ./promptStorage */ "./src/promptStorage.js");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log('Prompt Manager is now active!');

  // Initialize the prompt storage
  var promptStorage = new PromptStorage(context);

  // Register the command to open the prompt manager
  var disposable = vscode.commands.registerCommand('prompt-manager.openPromptManager', function () {
    PromptManagerPanel.createOrShow(context.extensionUri, promptStorage);
  });
  context.subscriptions.push(disposable);
  vscode.window.registerWebviewViewProvider('promptLibrary', {
    resolveWebviewView: function resolveWebviewView(webviewView) {
      webviewView.webview.options = {
        enableScripts: true
      };
      webviewView.webview.onDidReceiveMessage(function (message) {
        console.log('Received message:', message.command);
        switch (message.command) {
          case 'getPrompts':
            var prompts = promptStorage.getPrompts();
            webviewView.webview.postMessage({
              command: 'setPrompts',
              prompts: prompts
            });
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
var PromptManagerPanel = /*#__PURE__*/function () {
  function PromptManagerPanel(panel, extensionUri, promptStorage) {
    var _this = this;
    _classCallCheck(this, PromptManagerPanel);
    this.panel = panel;
    this.extensionUri = extensionUri;
    this.promptStorage = promptStorage;
    this._disposables = [];

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this.panel.onDidDispose(function () {
      return _this.dispose();
    }, null, this._disposables);

    // Update the content based on view changes
    this.panel.onDidChangeViewState(function (e) {
      if (_this.panel.visible) {
        _this._update();
      }
    }, null, this._disposables);

    // Handle messages from the webview
    this.panel.webview.onDidReceiveMessage(function (message) {
      switch (message.command) {
        case 'getPrompts':
          var prompts = _this.promptStorage.getPrompts();
          // console.log('Sending prompts:', prompts);
          _this.panel.webview.postMessage({
            command: 'setPrompts',
            prompts: prompts
          });
          vscode.window.showInformationMessage('Prompts set successfully!');
          return;
        case 'addPrompt':
          var newPrompt = _this.promptStorage.addPrompt(message.prompt);
          if (newPrompt) {
            _this.panel.webview.postMessage({
              command: 'promptAdded',
              prompt: newPrompt
            });
            vscode.window.showInformationMessage('Prompt added successfully!');
          }
          return;
        case 'updatePrompt':
          var updatedPrompt = _this.promptStorage.updatePrompt(message.id, message.prompt);
          if (updatedPrompt) {
            _this.panel.webview.postMessage({
              command: 'promptUpdated',
              prompt: updatedPrompt
            });
            vscode.window.showInformationMessage('Prompt updated successfully!');
          }
          return;
        case 'deletePrompt':
          var deleted = _this.promptStorage.deletePrompt(message.id);
          if (deleted) {
            _this.panel.webview.postMessage({
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
    }, null, this._disposables);
  }
  return _createClass(PromptManagerPanel, [{
    key: "dispose",
    value: function dispose() {
      PromptManagerPanel.currentPanel = undefined;

      // Clean up our resources
      this.panel.dispose();
      while (this._disposables.length) {
        var x = this._disposables.pop();
        if (x) {
          x.dispose();
        }
      }
    }
  }, {
    key: "_update",
    value: function _update() {
      var webview = this.panel.webview;
      this.panel.title = "Prompt Manager";
      this.panel.webview.html = this._getHtmlForWebview(webview);
    }
  }, {
    key: "_getHtmlForWebview",
    value: function _getHtmlForWebview(webview) {
      // Get the local path to script
      var scriptPathOnDisk = vscode.Uri.joinPath(this.extensionUri, 'dist', 'webview.js');
      var scriptUri = webview.asWebviewUri(scriptPathOnDisk);

      // Use a nonce to allow only specific scripts to be run
      var nonce = getNonce();
      return "<!DOCTYPE html>\n      <html lang=\"en\">\n      <head>\n        <meta charset=\"UTF-8\">\n        <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n        <meta http-equiv=\"Content-Security-Policy\" content=\"default-src 'none'; style-src ".concat(webview.cspSource, " 'unsafe-inline'; script-src 'nonce-").concat(nonce, "';\">\n        <title>Prompt Manager Trainer</title>\n      </head>\n      <body>\n        <div id=\"root\"></div>\n        <script nonce=\"").concat(nonce, "\" src=\"").concat(scriptUri, "\"></script>\n      </body>\n      </html>");
    }
  }], [{
    key: "createOrShow",
    value: function createOrShow(extensionUri, promptStorage) {
      var column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

      // If we already have a panel, show it
      if (PromptManagerPanel.currentPanel) {
        PromptManagerPanel.currentPanel.panel.reveal(column);
        return;
      }

      // Otherwise, create a new panel
      var panel = vscode.window.createWebviewPanel(PromptManagerPanel.viewType, 'Prompt Manager', column || vscode.ViewColumn.One, {
        // Enable JavaScript in the webview
        enableScripts: true,
        // Restrict the webview to only load resources from our extension's directory
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'dist'), vscode.Uri.joinPath(extensionUri, 'media')]
      });
      PromptManagerPanel.currentPanel = new PromptManagerPanel(panel, extensionUri, promptStorage);
    }
  }]);
}();
_defineProperty(PromptManagerPanel, "currentPanel", undefined);
_defineProperty(PromptManagerPanel, "viewType", 'promptManager');
function getNonce() {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
function deactivate() {}
module.exports = {
  activate: activate,
  deactivate: deactivate
};

/***/ }),

/***/ "./src/promptStorage.js":
/*!******************************!*\
  !*** ./src/promptStorage.js ***!
  \******************************/
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toConsumableArray(r) { return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread(); }
function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _iterableToArray(r) { if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r); }
function _arrayWithoutHoles(r) { if (Array.isArray(r)) return _arrayLikeToArray(r); }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
function _classCallCheck(a, n) { if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function"); }
function _defineProperties(e, r) { for (var t = 0; t < r.length; t++) { var o = r[t]; o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o); } }
function _createClass(e, r, t) { return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", { writable: !1 }), e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var vscode = __webpack_require__(/*! vscode */ "vscode");
var path = __webpack_require__(/*! path */ "path");
var fs = __webpack_require__(/*! fs */ "fs");

// Sample prompt data used as default if no storage exists yet
var defaultPrompts = [{
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
}, {
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
}, {
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
}, {
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
}, {
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
}];

/**
 * Manages prompt storage and loading
 */
var PromptStorage = /*#__PURE__*/function () {
  function PromptStorage(context) {
    _classCallCheck(this, PromptStorage);
    this.storagePath = context.globalStoragePath;
    this.promptsFilePath = path.join(this.storagePath, 'prompts.json');
    this.ensureStorageExists();
  }

  /**
   * Ensures the storage directory exists
   */
  return _createClass(PromptStorage, [{
    key: "ensureStorageExists",
    value: function ensureStorageExists() {
      if (!fs.existsSync(this.storagePath)) {
        fs.mkdirSync(this.storagePath, {
          recursive: true
        });
      }
    }

    /**
     * Gets all stored prompts
     */
  }, {
    key: "getPrompts",
    value: function getPrompts() {
      console.log('Reading prompts from:', this.promptsFilePath);
      try {
        if (fs.existsSync(this.promptsFilePath)) {
          var data = fs.readFileSync(this.promptsFilePath, 'utf8');
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
  }, {
    key: "savePrompts",
    value: function savePrompts(prompts) {
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
  }, {
    key: "addPrompt",
    value: function addPrompt(prompt) {
      var prompts = this.getPrompts();
      // Generate a new ID (max ID + 1)
      var newId = Math.max.apply(Math, _toConsumableArray(prompts.map(function (p) {
        return p.id;
      })).concat([0])) + 1;
      var newPrompt = _objectSpread(_objectSpread({}, prompt), {}, {
        id: newId,
        lastModified: new Date().toISOString().split('T')[0]
      });
      prompts.push(newPrompt);
      return this.savePrompts(prompts) ? newPrompt : null;
    }

    /**
     * Updates an existing prompt
     * @param {Number} id - ID of the prompt to update
     * @param {Object} updatedPrompt - Updated prompt data
     */
  }, {
    key: "updatePrompt",
    value: function updatePrompt(id, updatedPrompt) {
      var prompts = this.getPrompts();
      var index = prompts.findIndex(function (p) {
        return p.id === id;
      });
      if (index === -1) {
        return null;
      }
      prompts[index] = _objectSpread(_objectSpread({}, updatedPrompt), {}, {
        id: id,
        lastModified: new Date().toISOString().split('T')[0]
      });
      return this.savePrompts(prompts) ? prompts[index] : null;
    }

    /**
     * Deletes a prompt
     * @param {Number} id - ID of the prompt to delete
     */
  }, {
    key: "deletePrompt",
    value: function deletePrompt(id) {
      var prompts = this.getPrompts();
      var filteredPrompts = prompts.filter(function (p) {
        return p.id !== id;
      });
      if (filteredPrompts.length === prompts.length) {
        return false; // No prompt was deleted
      }
      return this.savePrompts(filteredPrompts);
    }
  }]);
}();
module.exports = PromptStorage;

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "vscode":
/*!*************************!*\
  !*** external "vscode" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("vscode");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./src/extension.js");
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map