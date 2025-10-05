# Troubleshooting Guide

## Common Issues and Solutions

---

## 🔑 API Key Issues

### Problem: "ANTHROPIC_API_KEY not found in environment"
**Solution:**
1. Create a `.env` file in the root directory
2. Add your API key: `ANTHROPIC_API_KEY=sk-ant-api...`
3. Get your key from: https://console.anthropic.com/settings/keys

### Problem: Claude API rate limiting
**Solution:**
- Wait a few minutes before retrying
- Consider upgrading your API plan
- Implement retry logic with exponential backoff

---

## 📅 Google Calendar Issues

### Problem: Calendar events not fetching
**Solutions:**
1. Verify OAuth credentials in `~/.config/claude/config.json`
2. Check that you've replaced `YOUR_GOOGLE_CLIENT_ID` and `YOUR_GOOGLE_CLIENT_SECRET`
3. Ensure Google Calendar API is enabled in Google Cloud Console
4. Verify redirect URI matches exactly: `http://localhost:3000/oauth/callback`

### Problem: "Not authorized" errors
**Solutions:**
- Reinstall app to workspace in Google Cloud Console
- Check OAuth scopes include calendar permissions
- Verify the calendar email address is correct

---

## 💬 Slack Issues

### Problem: Can't invite bot to channel
**Solutions:**
1. Ensure you have User Token Scopes configured
2. Add these scopes:
   - `channels:history`
   - `channels:read`
   - `groups:history`
   - `users:read`
3. Reinstall app to workspace after adding scopes
4. Use the User OAuth Token (`xoxp-...`) instead of just Bot token

### Problem: Bot can't read messages
**Solutions:**
- For private channels: Use `/invite @rachels_slack_agent`
- Check bot has correct permissions in Slack app settings
- Verify both Bot and User tokens are configured
- Ensure MCP server is running (check with `/mcp` in Claude)

---

## 🌐 Agent Manager Issues

### Problem: Port 3000 already in use
**Solution:**
```bash
# Find process using port
lsof -i :3000
# Kill the process
kill -9 [PID]
# Or change port in server.js
```

### Problem: Agents not showing up
**Solutions:**
- Ensure agent files are in `/agents` directory
- Check files have `.md` extension
- Verify markdown format is correct
- Click "Refresh" button in interface

### Problem: "View Output" not working
**Solutions:**
- Ensure server is running (`npm start`)
- Check browser console for errors
- Verify output files exist in project directory
- Try refreshing the page

---

## 🏗️ Build Issues

### Problem: "tsc: command not found"
**Solution:**
```bash
npm install
npm run build
```

### Problem: Module import errors
**Solutions:**
- Ensure you're using `.js` extensions in imports
- Check `tsconfig.json` for correct module settings
- Verify Node.js version supports ES modules

---

## 🔌 MCP Server Issues

### Problem: MCP servers not loading
**Solutions:**
1. Restart Claude Desktop completely
2. Check `~/.config/claude/config.json` syntax
3. Verify MCP server packages are installed:
   ```bash
   npm list -g @cocal/google-calendar-mcp
   npm list -g slack-mcp-server
   ```

### Problem: MCP functions not available
**Solutions:**
- Ensure Claude Desktop is restarted after config changes
- Check that tokens/credentials are valid
- Verify server processes are running

---

## 🚀 Runtime Issues

### Problem: Agent fails to run
**Solutions:**
1. Build the project first: `npm run build`
2. Check input JSON format is valid
3. Verify agent markdown file exists
4. Check logs directory for error details

### Problem: "Cannot find module" errors
**Solution:**
```bash
npm install
npm run build
```

---

## 📝 Environment Setup

### Problem: Multiple npm start processes running
**Solution:**
```bash
# Kill all node processes
killall node
# Or find specific process
ps aux | grep npm
kill -9 [PID]
```

### Problem: Changes not reflecting
**Solutions:**
1. Clear browser cache (Cmd/Ctrl + Shift + R)
2. Restart the server
3. Check you're editing the right files
4. Verify files are saved

---

## 🔍 Debugging Tips

### Check Logs
- Agent execution logs: `/logs` directory
- Browser console: Right-click → Inspect → Console
- Server logs: Terminal where `npm start` is running

### Verify Configuration
```bash
# Check MCP config
cat ~/.config/claude/config.json

# Check environment variables
cat .env

# Check if servers are running
ps aux | grep node
```

### Test Components Individually
1. Test API key: Run `node dist/cli.js quick agents/task-manager.md`
2. Test MCP: Ask Claude "What MCP servers are available?"
3. Test web server: `curl http://localhost:3000/api/agents`

---

## 🆘 Getting Help

1. **Check Documentation**: Review files in `/agents/resources`
2. **GitHub Issues**: Report bugs at project repository
3. **Claude Help**: Ask Claude Code for assistance
4. **Logs**: Always check `/logs` directory for detailed error messages

---

## 💡 Pro Tips

- Always restart Claude Desktop after MCP config changes
- Keep your API keys secure and never commit them
- Use `npm run build` after any TypeScript changes
- Test with `quick` command before full `run`
- Check browser console for frontend errors
- Use absolute paths in file operations

---

Last Updated: September 28, 2025