#!/usr/bin/env node

/**
 * Tableau MCP Server
 *
 * Custom MCP server that provides Tableau REST API access to Claude
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { TableauAPI } from '../lib/tableau-api.js';

const server = new Server(
  {
    name: 'tableau-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize Tableau API client
const tableau = new TableauAPI();

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'tableau_sign_in',
        description: 'Authenticate to Tableau Cloud/Server',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'tableau_list_workbooks',
        description: 'List all workbooks the user has access to',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'tableau_find_workbook',
        description: 'Find a workbook by name',
        inputSchema: {
          type: 'object',
          properties: {
            workbookName: {
              type: 'string',
              description: 'Name of the workbook to find',
            },
          },
          required: ['workbookName'],
        },
      },
      {
        name: 'tableau_list_views',
        description: 'List all views in a workbook',
        inputSchema: {
          type: 'object',
          properties: {
            workbookId: {
              type: 'string',
              description: 'ID of the workbook',
            },
          },
          required: ['workbookId'],
        },
      },
      {
        name: 'tableau_find_view',
        description: 'Find a view by name within a workbook',
        inputSchema: {
          type: 'object',
          properties: {
            workbookId: {
              type: 'string',
              description: 'ID of the workbook',
            },
            viewName: {
              type: 'string',
              description: 'Name of the view to find',
            },
          },
          required: ['workbookId', 'viewName'],
        },
      },
      {
        name: 'tableau_get_view_data',
        description: 'Get data from a view (returns CSV format)',
        inputSchema: {
          type: 'object',
          properties: {
            viewId: {
              type: 'string',
              description: 'ID of the view',
            },
          },
          required: ['viewId'],
        },
      },
      {
        name: 'tableau_get_view_image',
        description: 'Download view as PNG image',
        inputSchema: {
          type: 'object',
          properties: {
            viewId: {
              type: 'string',
              description: 'ID of the view',
            },
          },
          required: ['viewId'],
        },
      },
      {
        name: 'tableau_parse_dashboard_url',
        description: 'Extract workbook and view names from a Tableau dashboard URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Tableau dashboard URL',
            },
          },
          required: ['url'],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!args) {
      throw new Error('Missing arguments');
    }

    switch (name) {
      case 'tableau_sign_in': {
        await tableau.signIn();
        return {
          content: [
            {
              type: 'text',
              text: 'Successfully authenticated to Tableau',
            },
          ],
        };
      }

      case 'tableau_list_workbooks': {
        const workbooks = await tableau.listWorkbooks();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workbooks, null, 2),
            },
          ],
        };
      }

      case 'tableau_find_workbook': {
        const workbook = await tableau.findWorkbook(args.workbookName as string);
        return {
          content: [
            {
              type: 'text',
              text: workbook ? JSON.stringify(workbook, null, 2) : 'Workbook not found',
            },
          ],
        };
      }

      case 'tableau_list_views': {
        const views = await tableau.listViews(args.workbookId as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(views, null, 2),
            },
          ],
        };
      }

      case 'tableau_find_view': {
        const view = await tableau.findView(
          args.workbookId as string,
          args.viewName as string
        );
        return {
          content: [
            {
              type: 'text',
              text: view ? JSON.stringify(view, null, 2) : 'View not found',
            },
          ],
        };
      }

      case 'tableau_get_view_data': {
        const data = await tableau.getViewData(args.viewId as string);
        return {
          content: [
            {
              type: 'text',
              text: data,
            },
          ],
        };
      }

      case 'tableau_get_view_image': {
        const imageBuffer = await tableau.getViewImage(args.viewId as string);
        return {
          content: [
            {
              type: 'text',
              text: `Image downloaded (${imageBuffer.length} bytes). Base64: ${imageBuffer.toString('base64').substring(0, 100)}...`,
            },
          ],
        };
      }

      case 'tableau_parse_dashboard_url': {
        const parsed = tableau.parseDashboardUrl(args.url as string);
        return {
          content: [
            {
              type: 'text',
              text: parsed ? JSON.stringify(parsed, null, 2) : 'Could not parse URL',
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Tableau MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
