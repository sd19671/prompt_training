const vscode = require('vscode');

/**
 * GitHub service for handling authentication and repository operations
 */
class GitHubService {
  constructor() {
    this.authenticationProvider = null;
  }

  /**
   * Initialize GitHub authentication using VS Code's built-in GitHub integration
   */
  async initialize() {
    try {
      // Get VS Code's GitHub authentication provider
      this.authenticationProvider = await vscode.authentication.getSession('github', ['repo'], { createIfNone: false });
      return this.authenticationProvider !== null;
    } catch (error) {
      console.error('Failed to initialize GitHub authentication:', error);
      return false;
    }
  }

  /**
   * Authenticate with GitHub using VS Code's authentication provider
   */
  async authenticate() {
    try {
      this.authenticationProvider = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
      return this.authenticationProvider !== null;
    } catch (error) {
      console.error('GitHub authentication failed:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated with GitHub
   */
  async isAuthenticated() {
    if (!this.authenticationProvider) {
      await this.initialize();
    }
    return this.authenticationProvider !== null;
  }

  /**
   * Get the authentication token
   */
  getAccessToken() {
    return this.authenticationProvider?.accessToken;
  }

  /**
   * Test connection to a GitHub repository
   */
  async testConnection(repository, branch = 'main', path = 'prompts') {
    try {
      if (!await this.isAuthenticated()) {
        return {
          success: false,
          message: 'Not authenticated with GitHub. Please authenticate first.'
        };
      }

      const token = this.getAccessToken();
      if (!token) {
        return {
          success: false,
          message: 'Failed to get authentication token.'
        };
      }

      // Validate repository format
      if (!repository || !repository.includes('/')) {
        return {
          success: false,
          message: 'Invalid repository format. Use "username/repository-name".'
        };
      }

      const [owner, repo] = repository.split('/');

      // Test repository access
      const repoResponse = await this.makeGitHubRequest(`/repos/${owner}/${repo}`, token);
      if (!repoResponse.success) {
        return {
          success: false,
          message: `Repository access failed: ${repoResponse.error}`
        };
      }

      // Test branch access
      const branchResponse = await this.makeGitHubRequest(`/repos/${owner}/${repo}/branches/${branch}`, token);
      if (!branchResponse.success) {
        return {
          success: false,
          message: `Branch '${branch}' not found or accessible.`
        };
      }

      // Test if we can list contents (this also tests read permissions)
      const contentsResponse = await this.makeGitHubRequest(`/repos/${owner}/${repo}/contents/${path}?ref=${branch}`, token);
      
      // It's okay if the path doesn't exist (404), we just need to verify we have access
      if (!contentsResponse.success && contentsResponse.status !== 404) {
        return {
          success: false,
          message: `Path access failed: ${contentsResponse.error}`
        };
      }

      // Check write permissions by testing if we can create a commit (dry run)
      const permissionsResponse = await this.makeGitHubRequest(`/repos/${owner}/${repo}`, token);
      if (permissionsResponse.success && permissionsResponse.data) {
        const permissions = permissionsResponse.data.permissions;
        if (!permissions || !permissions.push) {
          return {
            success: false,
            message: 'Repository access is read-only. Write permissions required for prompt synchronization.'
          };
        }
      }

      return {
        success: true,
        message: `Success! Connected to ${repository} on branch '${branch}'. Path '${path}' is accessible.`,
        repositoryInfo: {
          name: repoResponse.data.name,
          fullName: repoResponse.data.full_name,
          private: repoResponse.data.private,
          permissions: repoResponse.data.permissions
        }
      };

    } catch (error) {
      console.error('GitHub connection test failed:', error);
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }

  /**
   * Make a request to GitHub API
   */
  async makeGitHubRequest(endpoint, token) {
    try {
      const url = `https://api.github.com${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'VSCode-PromptManager'
        }
      });

      if (!response.ok) {
        return {
          success: false,
          status: response.status,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        status: response.status,
        data: data
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get repository contents
   */
  async getRepositoryContents(repository, path, branch = 'main') {
    try {
      if (!await this.isAuthenticated()) {
        throw new Error('Not authenticated with GitHub');
      }

      const token = this.getAccessToken();
      const [owner, repo] = repository.split('/');
      
      const response = await this.makeGitHubRequest(
        `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        token
      );

      return response;
    } catch (error) {
      console.error('Failed to get repository contents:', error);
      throw error;
    }
  }

  /**
   * Create or update a file in the repository
   */
  async createOrUpdateFile(repository, path, content, message, branch = 'main') {
    try {
      if (!await this.isAuthenticated()) {
        throw new Error('Not authenticated with GitHub');
      }

      const token = this.getAccessToken();
      const [owner, repo] = repository.split('/');

      // First, try to get the current file to get its SHA (required for updates)
      const currentFileResponse = await this.makeGitHubRequest(
        `/repos/${owner}/${repo}/contents/${path}?ref=${branch}`,
        token
      );

      const requestBody = {
        message: message,
        content: Buffer.from(content).toString('base64'),
        branch: branch
      };

      // If file exists, include its SHA for update
      if (currentFileResponse.success && currentFileResponse.data.sha) {
        requestBody.sha = currentFileResponse.data.sha;
      }

      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'VSCode-PromptManager',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create/update file:', error);
      throw error;
    }
  }
}

module.exports = GitHubService;