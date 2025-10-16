# Rule: Troubleshoot System Issues

## Goal

To guide an AI assistant through diagnosing and resolving common issues in the Chief of Staff agent system, including API key problems, integration failures, build errors, and runtime issues. This provides a systematic approach to debugging and fixing problems.

## Process

1. **Identify the Issue Category**:
   - API Key Issues (Anthropic, OpenAI)
   - Google Calendar Integration Issues
   - Slack Integration Issues
   - Agent Manager Web Dashboard Issues
   - Build and Compilation Issues
   - MCP Server Issues
   - Runtime Execution Issues
   - Environment Setup Issues
2. **Gather Information**:
   - Read the error message carefully
   - Check relevant log files in `/logs` directory
   - Verify environment variables in `.env` file
   - Check browser console for frontend errors
   - Review terminal output where server is running
3. **Check Common Causes**:
   - Missing or incorrect API keys
   - Outdated dependencies
   - Configuration file syntax errors
   - Port conflicts
   - Permission issues
   - Missing build step
4. **Apply Relevant Solutions**:
   - Refer to the troubleshooting sections below based on issue category
   - Try solutions in order from most common to least common
   - Verify each solution step before proceeding to next
5. **Verify the Fix**:
   - Test the component that was failing
   - Check logs for success messages
   - Confirm no new errors appeared
   - Run a test execution if applicable
6. **Document the Resolution**:
   - Note what fixed the issue
   - Update documentation if it was unclear
   - Consider adding error handling to prevent recurrence
7. **Escalate if Needed**:
   - If solutions don't work, check GitHub issues
   - Review project documentation in `/docs`
   - Ask Claude Code for assistance
   - Report new bugs with detailed reproduction steps

## Common Issues and Solutions

---

## 🔑 API Key Issues

### Problem: "ANTHROPIC_API_KEY not found in environment"

**Solution:**
1. Create a `.env` file in the root directory if it doesn't exist
2. Add your API key: `ANTHROPIC_API_KEY=sk-ant-api...`
3. Get your key from: https://console.anthropic.com/settings/keys
4. Restart any running servers or processes
5. Verify the key is loaded: `echo $ANTHROPIC_API_KEY` (should not be empty)

### Problem: Claude API rate limiting

**Symptoms:**
- Error messages about rate limits exceeded
- 429 HTTP status codes
- Temporary failures followed by success

**Solution:**
- Wait a few minutes before retrying
- Consider upgrading your API plan for higher limits
- Implement retry logic with exponential backoff
- Reduce frequency of API calls
- Check your usage at https://console.anthropic.com/

---

## 📅 Google Calendar Issues

### Problem: Calendar events not fetching

**Solutions:**
1. Verify OAuth credentials exist in `~/.config/claude/config.json`
2. Check that you've replaced placeholder values:
   - `YOUR_GOOGLE_CLIENT_ID` with actual client ID
   - `YOUR_GOOGLE_CLIENT_SECRET` with actual secret
3. Ensure Google Calendar API is enabled in Google Cloud Console:
   - Go to https://console.cloud.google.com/
   - Navigate to APIs & Services → Library
   - Search for "Google Calendar API"
   - Click "Enable"
4. Verify redirect URI matches exactly: `http://localhost:3000/oauth/callback`
5. Re-run authentication flow if credentials changed

### Problem: "Not authorized" errors

**Solutions:**
- Reinstall app to workspace in Google Cloud Console
- Check OAuth scopes include calendar permissions:
  - `https://www.googleapis.com/auth/calendar.readonly`
  - `https://www.googleapis.com/auth/calendar.events`
- Verify the calendar email address is correct
- Delete old tokens and re-authenticate:
  ```bash
  rm ~/.config/claude/gmail-token.json
  npm run calendar:auth
  ```

---

## 💬 Slack Issues

### Problem: Can't invite bot to channel

**Solutions:**
1. Ensure you have User Token Scopes configured (not just Bot Token Scopes)
2. Add these required scopes in Slack App settings:
   - `channels:history` - Read messages from public channels
   - `channels:read` - View basic channel information
   - `groups:history` - Read messages from private channels
   - `users:read` - View people in the workspace
3. Reinstall app to workspace after adding scopes:
   - Go to OAuth & Permissions
   - Click "Reinstall to Workspace"
   - Approve the new permissions
4. Use the User OAuth Token (`xoxp-...`) instead of just Bot token
5. For private channels, invite bot manually: `/invite @rachels_slack_agent`

### Problem: Bot can't read messages

**Solutions:**
- For private channels: Use `/invite @rachels_slack_agent` to add bot
- Check bot has correct permissions in Slack app settings
- Verify both Bot Token (`xoxb-...`) and User Token (`xoxp-...`) are configured in `.env`
- Ensure MCP server is running (check with `/mcp` command in Claude)
- Test bot can see channel:
  ```bash
  # List channels the bot can see
  curl -H "Authorization: Bearer $SLACK_BOT_TOKEN" \
    https://slack.com/api/conversations.list
  ```

---

## 🌐 Agent Manager Issues

### Problem: Port 3000 already in use

**Symptoms:**
- Error: `EADDRINUSE: address already in use :::3000`
- Server won't start

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 [PID]

# Or change port in server.js
# Edit apps/agent-manager/server.js
# Change: const PORT = 3000; to const PORT = 3001;
```

### Problem: Agents not showing up

**Solutions:**
- Ensure agent files are in `/agents` directory
- Check files have `.md` extension (not `.txt`)
- Verify markdown format is correct (frontmatter, proper structure)
- Click "Refresh" button in web interface
- Check server logs for parsing errors
- Restart the server:
  ```bash
  # Stop server (Ctrl+C)
  # Start again
  npm run server
  ```

### Problem: "View Output" not working

**Solutions:**
- Ensure server is running (`npm start` or `npm run server`)
- Check browser console for errors (F12 → Console tab)
- Verify output files exist in `/logs` directory
- Try refreshing the page (Cmd/Ctrl + Shift + R for hard refresh)
- Check file permissions on `/logs` directory
- Verify server has read access to output files

---

## 🏗️ Build Issues

### Problem: "tsc: command not found"

**Symptoms:**
- Build fails with TypeScript compiler not found
- `npm run build` doesn't work

**Solution:**
```bash
# Install dependencies (includes TypeScript)
npm install

# Try build again
npm run build

# If still failing, install TypeScript globally
npm install -g typescript
```

### Problem: Module import errors

**Symptoms:**
- Errors like "Cannot find module"
- Import path resolution failures
- ES module errors

**Solutions:**
- Ensure you're using `.js` extensions in TypeScript imports:
  ```typescript
  // Correct
  import { foo } from './bar.js';

  // Incorrect (will fail)
  import { foo } from './bar';
  ```
- Check `tsconfig.json` has correct module settings:
  ```json
  {
    "compilerOptions": {
      "module": "ESNext",
      "moduleResolution": "node"
    }
  }
  ```
- Verify Node.js version supports ES modules (v14.13.0+):
  ```bash
  node --version
  ```
- Ensure `package.json` has `"type": "module"`

---

## 🔌 MCP Server Issues

### Problem: MCP servers not loading

**Solutions:**
1. Restart Claude Desktop completely:
   - Quit Claude Desktop
   - Wait 5 seconds
   - Open Claude Desktop again
2. Check `~/.config/claude-code/mcp.json` syntax is valid:
   ```bash
   # Validate JSON
   cat ~/.config/claude-code/mcp.json | jq .
   ```
3. Verify MCP server packages are installed:
   ```bash
   npm list -g @cocal/google-calendar-mcp
   npm list -g slack-mcp-server
   ```
4. Check server paths are correct in config
5. Review Claude Code logs for MCP errors

### Problem: MCP functions not available

**Symptoms:**
- Claude says "I don't have access to that tool"
- MCP tools don't appear in available functions

**Solutions:**
- Ensure Claude Desktop is restarted after config changes
- Check that tokens/credentials are valid and not expired
- Verify server processes are running:
  ```bash
  ps aux | grep mcp
  ```
- Test server directly to verify it works
- Check MCP server logs for authentication errors

---

## 🚀 Runtime Issues

### Problem: Agent fails to run

**Symptoms:**
- Error when executing agent
- Agent completes but produces no output
- Unexpected errors in logs

**Solutions:**
1. Build the project first: `npm run build`
2. Check input JSON format is valid:
   ```bash
   # Validate JSON
   cat input.json | jq .
   ```
3. Verify agent markdown file exists and is properly formatted
4. Check logs directory for error details:
   ```bash
   ls -la logs/
   tail -f logs/latest.log
   ```
5. Test with `quick` command first:
   ```bash
   node dist/cli.js quick agents/your-agent.md
   ```

### Problem: "Cannot find module" errors

**Symptoms:**
- Runtime errors about missing modules
- Import failures

**Solution:**
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify dist/ directory was created
ls -la dist/

# Try running again
node dist/cli.js run agents/your-agent.md
```

---

## 📝 Environment Setup

### Problem: Multiple npm start processes running

**Symptoms:**
- Port conflicts
- Multiple servers responding
- Unclear which process to stop

**Solution:**
```bash
# Kill all node processes
killall node

# Or find specific process
ps aux | grep npm
kill -9 [PID]

# For port-specific cleanup
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### Problem: Changes not reflecting

**Symptoms:**
- Code changes don't appear in running app
- Old behavior persists after edits

**Solutions:**
1. Clear browser cache (Cmd/Ctrl + Shift + R for hard refresh)
2. Restart the server:
   ```bash
   # Stop (Ctrl+C)
   # Start again
   npm start
   ```
3. Check you're editing the right files (verify file paths)
4. Verify files are saved (check for unsaved indicator in editor)
5. For TypeScript changes, rebuild:
   ```bash
   npm run build
   ```

---

## 🔍 Debugging Tips

### Check Logs

Always start by checking logs:
- **Agent execution logs**: `/logs` directory
- **Browser console**: Right-click → Inspect → Console
- **Server logs**: Terminal where `npm start` is running
- **System logs**: Check for OS-level errors

### Verify Configuration

```bash
# Check MCP config
cat ~/.config/claude-code/mcp.json

# Check environment variables
cat .env

# Verify API keys are set (shows yes/no, not actual key)
[ -z "$ANTHROPIC_API_KEY" ] && echo "Not set" || echo "Set"

# Check if servers are running
ps aux | grep node
```

### Test Components Individually

Isolate the problem by testing each component:

1. **Test API key**:
   ```bash
   node dist/cli.js quick agents/task-manager.md
   ```

2. **Test MCP**:
   - Ask Claude Code: "What MCP servers are available?"
   - Should list configured servers

3. **Test web server**:
   ```bash
   curl http://localhost:3000/api/agents
   # Should return JSON list of agents
   ```

4. **Test specific integrations**:
   ```bash
   # Google Calendar
   npm run calendar:today

   # Slack
   npm run slack:test

   # Dossier
   npm run dossier:generate
   ```

---

## 🆘 Getting Help

When you need additional help:

1. **Check Documentation**: Review files in `/docs` directory:
   - `/docs/setup.md` - Setup instructions
   - `/docs/quick-start.md` - Getting started
   - `/docs/reference/` - Detailed references

2. **GitHub Issues**: Report bugs at the project repository
   - Include error messages
   - Provide reproduction steps
   - Attach relevant logs

3. **Claude Code**: Ask Claude for assistance:
   - Describe the problem clearly
   - Share error messages
   - Explain what you've tried

4. **Logs**: Always check `/logs` directory for detailed error messages:
   ```bash
   # View recent logs
   ls -lt logs/ | head

   # Read latest log
   cat logs/$(ls -t logs/ | head -1)
   ```

---

## 💡 Pro Tips

Best practices to avoid common issues:

- **Restart Claude Desktop** after MCP config changes - this is the #1 fix for MCP issues
- **Keep API keys secure** and never commit them to version control
- **Use `npm run build`** after any TypeScript changes - don't forget!
- **Test with `quick` command** before full `run` to catch errors early
- **Check browser console** for frontend errors - press F12
- **Use absolute paths** in file operations to avoid path confusion
- **Validate JSON** before using as input - use `jq` or online validators
- **Read error messages** carefully - they often tell you exactly what's wrong
- **Check file permissions** if you get access denied errors
- **Keep dependencies updated** with `npm update`

---

## Output

A systematic troubleshooting approach that:
1. Identifies the issue category (API, integrations, build, runtime, etc.)
2. Gathers diagnostic information from logs and configuration
3. Checks common causes systematically
4. Applies targeted solutions based on the specific issue
5. Verifies the fix resolved the problem
6. Documents the resolution for future reference
7. Provides escalation path if solutions don't work

## Target Audience

This workflow is designed for AI assistants and developers troubleshooting the Chief of Staff agent system, providing a comprehensive reference for diagnosing and fixing common issues.

## Notes

- Most issues are configuration-related (missing API keys, wrong paths)
- Always check logs first - they contain crucial error details
- MCP issues almost always require restarting Claude Desktop
- Build issues usually mean `npm install` or `npm run build` was skipped
- Port conflicts are common - use `lsof` to find and kill conflicting processes
- When in doubt, restart everything (server, Claude Desktop, browser)
- Keep this guide updated as new issues are discovered

---

*When something breaks, don't panic - systematically work through the troubleshooting steps.*

Last Updated: September 28, 2025
