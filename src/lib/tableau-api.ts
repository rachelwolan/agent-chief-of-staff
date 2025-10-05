import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

interface TableauAuthResponse {
  credentials: {
    token: string;
    site: {
      id: string;
      contentUrl: string;
    };
  };
}

interface TableauWorkbook {
  id: string;
  name: string;
  contentUrl: string;
  project: { id: string; name: string };
}

interface TableauView {
  id: string;
  name: string;
  contentUrl: string;
  workbook: { id: string };
}

export class TableauAPI {
  private baseUrl: string;
  private siteName: string;
  private tokenName?: string;
  private tokenSecret?: string;
  private username?: string;
  private password?: string;

  private apiToken?: string;
  private siteId?: string;
  private client: AxiosInstance;

  constructor() {
    this.baseUrl = process.env.TABLEAU_SITE_URL || 'https://prod-useast-a.online.tableau.com';
    this.siteName = process.env.TABLEAU_SITE_NAME || 'webflowanalytics';
    this.tokenName = process.env.TABLEAU_TOKEN_NAME;
    this.tokenSecret = process.env.TABLEAU_TOKEN_SECRET;
    this.username = process.env.TABLEAU_USERNAME;
    this.password = process.env.TABLEAU_PASSWORD;

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  }

  /**
   * Authenticate to Tableau using PAT or username/password
   */
  async signIn(): Promise<void> {
    const apiVersion = '3.21';

    let requestBody: any;

    if (this.tokenName && this.tokenSecret) {
      // Authenticate with Personal Access Token
      requestBody = {
        credentials: {
          personalAccessTokenName: this.tokenName,
          personalAccessTokenSecret: this.tokenSecret,
          site: {
            contentUrl: this.siteName,
          },
        },
      };
    } else if (this.username && this.password) {
      // Authenticate with username/password
      requestBody = {
        credentials: {
          name: this.username,
          password: this.password,
          site: {
            contentUrl: this.siteName,
          },
        },
      };
    } else {
      throw new Error('Missing Tableau credentials. Set either TOKEN_NAME/TOKEN_SECRET or USERNAME/PASSWORD in .env');
    }

    try {
      const response = await this.client.post<TableauAuthResponse>(
        `/api/${apiVersion}/auth/signin`,
        requestBody
      );

      this.apiToken = response.data.credentials.token;
      this.siteId = response.data.credentials.site.id;

      // Add token to future requests
      this.client.defaults.headers.common['X-Tableau-Auth'] = this.apiToken;

      console.log('✓ Authenticated to Tableau successfully');
      console.log(`  Site ID: ${this.siteId}`);
    } catch (error: any) {
      console.error('✗ Failed to authenticate to Tableau:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Sign out from Tableau
   */
  async signOut(): Promise<void> {
    if (!this.apiToken) return;

    const apiVersion = '3.21';

    try {
      await this.client.post(`/api/${apiVersion}/auth/signout`);
      console.log('✓ Signed out from Tableau');
    } catch (error: any) {
      console.error('✗ Failed to sign out:', error.response?.data || error.message);
    }

    this.apiToken = undefined;
    this.siteId = undefined;
    delete this.client.defaults.headers.common['X-Tableau-Auth'];
  }

  /**
   * List all workbooks the user has access to
   */
  async listWorkbooks(): Promise<TableauWorkbook[]> {
    this.ensureAuthenticated();

    const apiVersion = '3.21';

    try {
      const response = await this.client.get(
        `/api/${apiVersion}/sites/${this.siteId}/workbooks`
      );

      const workbooks = response.data.workbooks.workbook || [];
      console.log(`✓ Found ${workbooks.length} workbooks`);
      return workbooks;
    } catch (error: any) {
      console.error('✗ Failed to list workbooks:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Find workbook by name
   */
  async findWorkbook(workbookName: string): Promise<TableauWorkbook | null> {
    const workbooks = await this.listWorkbooks();
    return workbooks.find(wb => wb.name === workbookName) || null;
  }

  /**
   * List all views in a workbook
   */
  async listViews(workbookId: string): Promise<TableauView[]> {
    this.ensureAuthenticated();

    const apiVersion = '3.21';

    try {
      const response = await this.client.get(
        `/api/${apiVersion}/sites/${this.siteId}/workbooks/${workbookId}/views`
      );

      const views = response.data.views.view || [];
      console.log(`✓ Found ${views.length} views in workbook`);
      return views;
    } catch (error: any) {
      console.error('✗ Failed to list views:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Find view by name within a workbook
   */
  async findView(workbookId: string, viewName: string): Promise<TableauView | null> {
    const views = await this.listViews(workbookId);
    return views.find(v => v.name === viewName) || null;
  }

  /**
   * Get view data (returns CSV format)
   */
  async getViewData(viewId: string): Promise<string> {
    this.ensureAuthenticated();

    const apiVersion = '3.21';

    try {
      const response = await this.client.get(
        `/api/${apiVersion}/sites/${this.siteId}/views/${viewId}/data`,
        {
          headers: {
            'Accept': 'text/csv',
          },
        }
      );

      console.log(`✓ Retrieved view data (${response.data.length} bytes)`);
      return response.data;
    } catch (error: any) {
      console.error('✗ Failed to get view data:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Download view as image
   */
  async getViewImage(viewId: string): Promise<Buffer> {
    this.ensureAuthenticated();

    const apiVersion = '3.21';

    try {
      const response = await this.client.get(
        `/api/${apiVersion}/sites/${this.siteId}/views/${viewId}/image`,
        {
          responseType: 'arraybuffer',
        }
      );

      console.log(`✓ Downloaded view image (${response.data.length} bytes)`);
      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('✗ Failed to get view image:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get workbook and view from dashboard URL
   */
  parseDashboardUrl(url: string): { workbookName: string; viewName: string } | null {
    // URL format: https://prod-useast-a.online.tableau.com/#/site/webflowanalytics/views/WIPConsolidatedDashboard/Scorecard?:iid=1
    const match = url.match(/\/views\/([^/]+)\/([^?]+)/);

    if (!match) {
      return null;
    }

    return {
      workbookName: match[1],
      viewName: match[2],
    };
  }

  private ensureAuthenticated(): void {
    if (!this.apiToken || !this.siteId) {
      throw new Error('Not authenticated. Call signIn() first.');
    }
  }
}
