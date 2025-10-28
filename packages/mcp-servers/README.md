# MCP Servers Directory

This directory contains all Model Context Protocol (MCP) servers integrated with the Chief of Staff system.

## 📁 Directory Structure

```
packages/mcp-servers/
├── README.md                    # This file
├── gong-mcp/                    # Gong call recordings & transcripts
└── amazing-marvin-mcp/          # Amazing Marvin task management
```

## 🔧 Installed MCP Servers

### 1. Gong MCP Server
**Purpose**: Access Gong call recordings and transcripts for meeting preparation

**Location**: `./gong-mcp/`

**Installation**: ✅ Installed (Node.js)

**Configuration Needed**:
- `GONG_ACCESS_KEY`: Your Gong API access key
- `GONG_ACCESS_SECRET`: Your Gong API secret

**How to get credentials**:
1. Go to https://app.gong.io/company/api
2. Click "Create" to generate new API credentials
3. Copy both the Access Key and Access Key Secret

**Tools Available**:
- List Gong calls with date range filtering
- Retrieve detailed transcripts for specific calls

**Status**: ⏸️ Awaiting API credentials

---

### 2. Amazing Marvin MCP Server
**Purpose**: Integrate Amazing Marvin productivity system with AI for task management

**Location**: `./amazing-marvin-mcp/` (source code reference)

**Installation**: ⚠️ Requires Python 3.10+ (current system: check with `python3 --version`)

**Install command**:
```bash
pip3 install amazing-marvin-mcp
```

**Configuration Needed**:
- `AMAZING_MARVIN_API_KEY`: Your Amazing Marvin API key

**How to get credentials**:
1. Open Amazing Marvin → Settings → API
2. Enable the API and copy your token

**Tools Available** (28 tools total):
- Daily productivity overview
- Task management (create, complete, batch operations)
- Project management
- Time tracking
- Goals and rewards
- Productivity analytics

**Status**: ⏸️ Awaiting Python 3.10+ upgrade and API credentials

---

## 📝 Claude Desktop Configuration

All MCP servers are configured in:
`~/Library/Application Support/Claude/claude_desktop_config.json`

Current configuration includes:
- ✅ Webflow MCP (official)
- ✅ Slack MCP (official)
- ⏸️ Gong MCP (awaiting credentials)
- ⏸️ Amazing Marvin MCP (awaiting Python upgrade)

---

## 🚀 Next Steps

### To Complete Gong Integration:
1. Get Gong API credentials from https://app.gong.io/company/api
2. Add credentials to Claude config file
3. Restart Claude Desktop
4. Test with: "List my recent Gong calls"

### To Complete Amazing Marvin Integration:
1. Upgrade Python to 3.10+: `brew install python@3.10`
2. Install package: `pip3.10 install amazing-marvin-mcp`
3. Get Amazing Marvin API key from app settings
4. Add credentials to Claude config file
5. Restart Claude Desktop
6. Test with: "What tasks do I have today?"

---

## 📚 Resources

- [Model Context Protocol Docs](https://modelcontextprotocol.io/)
- [Gong MCP Server](https://github.com/kenazk/gong-mcp)
- [Amazing Marvin MCP](https://github.com/bgheneti/Amazing-Marvin-MCP)
- [Official MCP Servers](https://github.com/modelcontextprotocol/servers)

---

Last updated: October 22, 2025
