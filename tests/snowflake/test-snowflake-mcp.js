import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testSnowflakeMCP() {
  console.log('Starting Snowflake MCP test...\n');

  try {
    // Create transport for Snowflake MCP server
    const transport = new StdioClientTransport({
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-snowflake'],
      env: {
        ...process.env,
        SNOWFLAKE_USER: process.env.SNOWFLAKE_USER,
        SNOWFLAKE_ACCOUNT: process.env.SNOWFLAKE_ACCOUNT,
        SNOWFLAKE_DATABASE: process.env.SNOWFLAKE_DATABASE,
        SNOWFLAKE_WAREHOUSE: process.env.SNOWFLAKE_WAREHOUSE,
        SNOWFLAKE_AUTHENTICATOR: process.env.SNOWFLAKE_AUTHENTICATOR
      }
    });

    // Create MCP client
    const client = new Client({
      name: 'snowflake-test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    // Connect
    await client.connect(transport);
    console.log('✓ Connected to Snowflake MCP server\n');

    // List available tools
    const tools = await client.listTools();
    console.log('Available tools:');
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });
    console.log('');

    // Try a simple query
    console.log('Testing query execution...');
    const result = await client.callTool({
      name: 'snowflake-query',
      arguments: {
        query: 'SELECT CURRENT_VERSION() as version, CURRENT_USER() as user, CURRENT_WAREHOUSE() as warehouse'
      }
    });

    console.log('✓ Query executed successfully');
    console.log('Result:', JSON.stringify(result, null, 2));

    // Close connection
    await client.close();
    console.log('\n✓ Test completed successfully');
    process.exit(0);

  } catch (error) {
    console.error('✗ Test failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testSnowflakeMCP();
