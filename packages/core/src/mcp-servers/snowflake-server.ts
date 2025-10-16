#!/usr/bin/env node

/**
 * Snowflake MCP Server
 *
 * Custom MCP server that provides Snowflake database access to Claude
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import snowflake from 'snowflake-sdk';

const server = new Server(
  {
    name: 'snowflake-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Snowflake connection
let connection: any = null;

/**
 * Initialize Snowflake connection with externalbrowser authentication
 */
async function connect(): Promise<void> {
  if (connection) {
    return; // Already connected
  }

  const account = process.env.SNOWFLAKE_ACCOUNT;
  const username = process.env.SNOWFLAKE_USER;
  const database = process.env.SNOWFLAKE_DATABASE;
  const schema = process.env.SNOWFLAKE_SCHEMA || 'PUBLIC';
  const warehouse = process.env.SNOWFLAKE_WAREHOUSE;
  const authenticator = process.env.SNOWFLAKE_AUTHENTICATOR || 'externalbrowser';

  if (!account || !username) {
    throw new Error('SNOWFLAKE_ACCOUNT and SNOWFLAKE_USER environment variables are required');
  }

  return new Promise((resolve, reject) => {
    connection = snowflake.createConnection({
      account,
      username,
      database,
      schema,
      warehouse,
      authenticator,
    });

    connection.connect((err: Error, conn: any) => {
      if (err) {
        console.error('Failed to connect to Snowflake:', err);
        connection = null;
        reject(err);
      } else {
        console.error('Successfully connected to Snowflake');
        resolve();
      }
    });
  });
}

/**
 * Execute a SQL query
 */
async function executeQuery(query: string): Promise<any[]> {
  if (!connection) {
    await connect();
  }

  return new Promise((resolve, reject) => {
    connection.execute({
      sqlText: query,
      complete: (err: Error, stmt: any, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      },
    });
  });
}

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'snowflake_query',
        description: 'Execute a SQL query against Snowflake database',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'SQL query to execute',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'snowflake_get_signups',
        description: 'Get signup count for a specific date',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format (default: yesterday)',
            },
          },
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

    if (name === 'snowflake_query') {
      const query = args.query as string;
      const rows = await executeQuery(query);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(rows, null, 2),
          },
        ],
      };
    }

    if (name === 'snowflake_get_signups') {
      const date = args.date as string | undefined;
      const dateCondition = date
        ? `DATE(created_at_utc) = '${date}'`
        : `DATE(created_at_utc) = CURRENT_DATE() - 1`;

      const query = `
        SELECT COUNT(*) as signups_count
        FROM ANALYTICS.PRODUCT.DIM_USER
        WHERE ${dateCondition}
          AND _fivetran_deleted = FALSE
          AND is_spam = FALSE
      `;

      const rows = await executeQuery(query);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(rows[0], null, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
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
  console.error('Snowflake MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
