import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/documents.readonly'
];
const TOKEN_PATH = path.join(process.env.HOME || '', '.config', 'claude', 'gmail-token.json');

export interface GoogleDocContent {
  id: string;
  title: string;
  content: string;
  url: string;
  createdTime?: string;
  modifiedTime?: string;
}

export class GoogleDocsService {
  private oauth2Client: OAuth2Client | null = null;

  /**
   * Initialize OAuth2 client with credentials from .env
   */
  private getOAuth2Client(): OAuth2Client {
    if (this.oauth2Client) {
      return this.oauth2Client;
    }

    const clientId = process.env.PERSONAL_GMAIL_CLIENT_ID;
    const clientSecret = process.env.PERSONAL_GMAIL_CLIENT_SECRET;
    const redirectUri = process.env.PERSONAL_GMAIL_REDIRECT_URI || 'http://localhost:3000/oauth/gmail/callback';

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not found in .env file. Please set PERSONAL_GMAIL_CLIENT_ID and PERSONAL_GMAIL_CLIENT_SECRET');
    }

    this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Check if we have a token saved
    if (fs.existsSync(TOKEN_PATH)) {
      const token = fs.readFileSync(TOKEN_PATH, 'utf-8');
      this.oauth2Client.setCredentials(JSON.parse(token));
    } else {
      throw new Error('Google OAuth token not found. Please authenticate first with: npm run calendar:auth');
    }

    return this.oauth2Client;
  }

  /**
   * Extract document ID from various Google Docs URL formats
   */
  extractDocId(url: string): string | null {
    // Handle various Google Docs URL formats
    // https://docs.google.com/document/d/DOCUMENT_ID/edit
    // https://docs.google.com/document/d/DOCUMENT_ID/
    const patterns = [
      /\/document\/d\/([a-zA-Z0-9-_]+)/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/presentation\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Fetch content from a Google Doc
   */
  async fetchDocument(docId: string): Promise<GoogleDocContent> {
    const auth = this.getOAuth2Client();
    const docs = google.docs({ version: 'v1', auth });
    const drive = google.drive({ version: 'v3', auth });

    try {
      // Get document content
      const docResponse = await docs.documents.get({
        documentId: docId
      });

      const doc = docResponse.data;
      const title = doc.title || 'Untitled Document';

      // Extract text content from document
      const content = this.extractTextFromDoc(doc);

      // Get metadata from Drive API
      let createdTime, modifiedTime;
      try {
        const fileResponse = await drive.files.get({
          fileId: docId,
          fields: 'createdTime,modifiedTime'
        });
        createdTime = fileResponse.data.createdTime || undefined;
        modifiedTime = fileResponse.data.modifiedTime || undefined;
      } catch (error) {
        console.warn(`Could not fetch metadata for doc ${docId}`);
      }

      return {
        id: docId,
        title,
        content,
        url: `https://docs.google.com/document/d/${docId}`,
        createdTime,
        modifiedTime
      };
    } catch (error: any) {
      throw new Error(`Failed to fetch document ${docId}: ${error.message}`);
    }
  }

  /**
   * Extract plain text from Google Docs structure
   */
  private extractTextFromDoc(doc: any): string {
    if (!doc.body || !doc.body.content) {
      return '';
    }

    let text = '';

    const processStructuralElements = (elements: any[]): string => {
      let result = '';
      for (const element of elements) {
        if (element.paragraph) {
          const para = element.paragraph;
          if (para.elements) {
            for (const elem of para.elements) {
              if (elem.textRun && elem.textRun.content) {
                result += elem.textRun.content;
              }
            }
          }
        } else if (element.table) {
          // Handle tables
          const table = element.table;
          if (table.tableRows) {
            for (const row of table.tableRows) {
              if (row.tableCells) {
                for (const cell of row.tableCells) {
                  if (cell.content) {
                    result += processStructuralElements(cell.content);
                  }
                }
              }
            }
          }
        } else if (element.tableOfContents) {
          // Skip table of contents
          continue;
        }
      }
      return result;
    };

    text = processStructuralElements(doc.body.content);
    return text.trim();
  }

  /**
   * Fetch multiple documents
   */
  async fetchDocuments(docIds: string[]): Promise<GoogleDocContent[]> {
    const results: GoogleDocContent[] = [];
    const errors: string[] = [];

    for (const docId of docIds) {
      try {
        console.log(`   📄 Fetching document ${docId}...`);
        const doc = await this.fetchDocument(docId);
        results.push(doc);
        console.log(`      ✅ ${doc.title}`);
      } catch (error: any) {
        console.error(`      ❌ Error: ${error.message}`);
        errors.push(`${docId}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      console.warn(`\n⚠️  Failed to fetch ${errors.length} document(s):`);
      errors.forEach(err => console.warn(`   - ${err}`));
    }

    return results;
  }

  /**
   * Export document as plain text (alternative method using Drive API)
   */
  async exportAsText(docId: string): Promise<string> {
    const auth = this.getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth });

    try {
      const response = await drive.files.export({
        fileId: docId,
        mimeType: 'text/plain'
      }, {
        responseType: 'text'
      });

      return response.data as string;
    } catch (error: any) {
      throw new Error(`Failed to export document ${docId}: ${error.message}`);
    }
  }
}
