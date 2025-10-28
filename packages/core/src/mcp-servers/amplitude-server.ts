#!/usr/bin/env node

/**
 * Amplitude MCP Server
 *
 * Custom MCP server that provides Amplitude Analytics API access to Claude
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AmplitudeAPI } from '../lib/amplitude-api.js';

const server = new Server(
  {
    name: 'amplitude-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Initialize Amplitude API client
const amplitude = new AmplitudeAPI();

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'amplitude_test_connection',
        description: 'Test connection to Amplitude API',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'amplitude_list_events',
        description: 'List all events tracked in Amplitude',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'amplitude_get_daily_active_users',
        description: 'Get daily active users (DAU) for a date range',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Start date in YYYY-MM-DD format (default: 7 days ago)',
            },
            endDate: {
              type: 'string',
              description: 'End date in YYYY-MM-DD format (default: yesterday)',
            },
          },
        },
      },
      {
        name: 'amplitude_get_realtime_users',
        description: 'Get real-time active users (last 5 minutes)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'amplitude_get_event_totals',
        description: 'Get event totals for a specific event over a date range',
        inputSchema: {
          type: 'object',
          properties: {
            eventName: {
              type: 'string',
              description: 'Name of the event to query',
            },
            startDate: {
              type: 'string',
              description: 'Start date in YYYY-MM-DD format',
            },
            endDate: {
              type: 'string',
              description: 'End date in YYYY-MM-DD format',
            },
            interval: {
              type: 'string',
              description: 'Interval: daily (1), weekly (7), or monthly (30)',
              enum: ['1', '7', '30'],
            },
          },
          required: ['eventName', 'startDate', 'endDate'],
        },
      },
      {
        name: 'amplitude_get_funnel',
        description: 'Get funnel conversion rates for a series of events',
        inputSchema: {
          type: 'object',
          properties: {
            events: {
              type: 'array',
              description: 'Array of event names in funnel order',
              items: { type: 'string' },
            },
            startDate: {
              type: 'string',
              description: 'Start date in YYYY-MM-DD format',
            },
            endDate: {
              type: 'string',
              description: 'End date in YYYY-MM-DD format',
            },
            mode: {
              type: 'string',
              description: 'Funnel mode: ordered, unordered, or sequential',
              enum: ['ordered', 'unordered', 'sequential'],
            },
          },
          required: ['events', 'startDate', 'endDate'],
        },
      },
      {
        name: 'amplitude_get_chart',
        description: 'Get data from a saved Amplitude chart by chart ID',
        inputSchema: {
          type: 'object',
          properties: {
            chartId: {
              type: 'string',
              description: 'The chart ID (found in Amplitude chart URL)',
            },
          },
          required: ['chartId'],
        },
      },
      {
        name: 'amplitude_get_session_length',
        description: 'Get average session length for a date range',
        inputSchema: {
          type: 'object',
          properties: {
            startDate: {
              type: 'string',
              description: 'Start date in YYYY-MM-DD format',
            },
            endDate: {
              type: 'string',
              description: 'End date in YYYY-MM-DD format',
            },
          },
          required: ['startDate', 'endDate'],
        },
      },
      {
        name: 'amplitude_search_user',
        description: 'Search for a user by user ID',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The user ID to search for',
            },
          },
          required: ['userId'],
        },
      },
      {
        name: 'amplitude_get_user_activity',
        description: 'Get event activity stream for a specific user',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'The user ID',
            },
            limit: {
              type: 'number',
              description: 'Number of events to return (max 1000)',
            },
          },
          required: ['userId'],
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
      case 'amplitude_test_connection': {
        const success = await amplitude.testConnection();
        return {
          content: [
            {
              type: 'text',
              text: success
                ? 'Successfully connected to Amplitude'
                : 'Failed to connect to Amplitude',
            },
          ],
        };
      }

      case 'amplitude_list_events': {
        const events = await amplitude.listEvents();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(events, null, 2),
            },
          ],
        };
      }

      case 'amplitude_get_daily_active_users': {
        const startDate = args.startDate
          ? (args.startDate as string)
          : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const endDate = args.endDate
          ? (args.endDate as string)
          : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const data = await amplitude.getDailyActiveUsers(startDate, endDate);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'amplitude_get_realtime_users': {
        const data = await amplitude.getRealtimeActiveUsers();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'amplitude_get_event_totals': {
        const eventName = args.eventName as string;
        const startDate = args.startDate as string;
        const endDate = args.endDate as string;
        const interval = (args.interval as string) || '1';

        const data = await amplitude.getEventSegmentation({
          e: { event_type: eventName },
          start: startDate.replace(/-/g, ''),
          end: endDate.replace(/-/g, ''),
          m: 'totals',
          i: interval,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'amplitude_get_funnel': {
        const events = args.events as string[];
        const startDate = args.startDate as string;
        const endDate = args.endDate as string;
        const mode = (args.mode as string) || 'ordered';

        const eventObjects = events.map((name) => ({ event_type: name }));

        const data = await amplitude.getFunnel({
          e: eventObjects,
          start: startDate.replace(/-/g, ''),
          end: endDate.replace(/-/g, ''),
          mode,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'amplitude_get_chart': {
        const chartId = args.chartId as string;
        const data = await amplitude.getChart(chartId);
        return {
          content: [
            {
              type: 'text',
              text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'amplitude_get_session_length': {
        const startDate = args.startDate as string;
        const endDate = args.endDate as string;
        const data = await amplitude.getAverageSessionLength(startDate, endDate);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'amplitude_search_user': {
        const userId = args.userId as string;
        const data = await amplitude.searchUser(userId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      }

      case 'amplitude_get_user_activity': {
        const userId = args.userId as string;
        const limit = (args.limit as number) || 100;
        const data = await amplitude.getUserActivity(userId, 0, limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(data, null, 2),
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
  console.error('Amplitude MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
