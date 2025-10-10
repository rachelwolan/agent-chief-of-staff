#!/usr/bin/env python3
"""
Simple test script for Snowflake MCP server.
Tests basic connectivity and available tools.
"""
import asyncio
import json
import os
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def test_snowflake_mcp():
    print("🔧 Starting Snowflake MCP test...\n")

    # Configuration
    config_path = os.path.join(os.getcwd(), "snowflake-mcp", "test-config.yaml")

    # Server parameters
    server_params = StdioServerParameters(
        command="uv",
        args=["run", "mcp-server-snowflake", config_path],
        env={
            **os.environ,
            "SNOWFLAKE_ACCOUNT": os.getenv("SNOWFLAKE_ACCOUNT"),
            "SNOWFLAKE_USER": os.getenv("SNOWFLAKE_USER"),
            "SNOWFLAKE_DATABASE": os.getenv("SNOWFLAKE_DATABASE"),
            "SNOWFLAKE_WAREHOUSE": os.getenv("SNOWFLAKE_WAREHOUSE"),
            "SNOWFLAKE_AUTHENTICATOR": os.getenv("SNOWFLAKE_AUTHENTICATOR"),
        }
    )

    try:
        async with stdio_client(server_params) as (read, write):
            async with ClientSession(read, write) as session:
                # Initialize the session
                await session.initialize()
                print("✓ Connected to Snowflake MCP server\n")

                # List available tools
                tools_list = await session.list_tools()
                print(f"📋 Available tools ({len(tools_list.tools)}):")
                for tool in tools_list.tools:
                    print(f"  • {tool.name}")
                    print(f"    {tool.description[:80]}...")
                print()

                # Try a simple query if query_manager is enabled
                if any(tool.name == "query_run_query" for tool in tools_list.tools):
                    print("🔍 Testing simple query...")
                    result = await session.call_tool(
                        "query_run_query",
                        arguments={
                            "query": "SELECT CURRENT_VERSION() as VERSION, CURRENT_USER() as USER, CURRENT_WAREHOUSE() as WAREHOUSE"
                        }
                    )
                    print("✓ Query executed successfully")
                    print(f"Result preview: {str(result.content)[:200]}...\n")

                print("✅ All tests passed!")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

    return True

if __name__ == "__main__":
    success = asyncio.run(test_snowflake_mcp())
    exit(0 if success else 1)
