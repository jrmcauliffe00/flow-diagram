# MCP Architecture Overview

## How MCP Works with Flow Diagrams

```
┌─────────────────────────────────────────────────────────────────┐
│                        LLM (Claude, GPT, etc.)                 │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │   Tool Discovery│    │  Tool Execution │                   │
│  │   GET /mcp/tools│    │ POST /mcp/tools │                   │
│  └─────────────────┘    └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/REST API
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MCP Server (Express.js)                     │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │  Tool Registry  │    │  API Controller │                   │
│  │  - create_diagram│    │  - CRUD ops     │                   │
│  │  - add_node     │    │  - Validation   │                   │
│  │  - visualize    │    │  - Error handling│                   │
│  └─────────────────┘    └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ Direct calls
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                Flow Diagram Library (TypeScript)               │
│  ┌─────────────────┐    ┌─────────────────┐                   │
│  │  FlowDiagram    │    │  Visualizer     │                   │
│  │  - Nodes/Edges  │    │  - SVG/HTML     │                   │
│  │  - Auto-layout  │    │  - Mermaid      │                   │
│  │  - Validation   │    │  - JSON/Text    │                   │
│  └─────────────────┘    └─────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **LLM Request**: "Create a flow diagram for user authentication"
2. **Tool Discovery**: LLM calls `GET /mcp/tools` to see available tools
3. **Tool Execution**: LLM calls `POST /mcp/tools/create_decision_tree/execute`
4. **Server Processing**: MCP server processes request and calls FlowDiagram library
5. **Response**: Server returns diagram data and visualization options
6. **LLM Usage**: LLM can now use the diagram data or request visualizations

## Example MCP Tool Call

```json
POST /mcp/tools/create_decision_tree/execute
{
  "parameters": {
    "rootLabel": "User Login",
    "decisions": [
      {"condition": "Valid?", "next": "Grant Access"},
      {"condition": "Invalid?", "next": "Show Error"}
    ],
    "title": "Authentication Flow"
  }
}
```

## Response

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "diagram": {
      "title": "Authentication Flow",
      "nodes": [...],
      "edges": [...]
    }
  }
}
```

## Deployment Options

### 1. Local Development
- Run `npm run dev` in mcp-server directory
- Server available at `http://localhost:3000`

### 2. Cloud Deployment
- **Heroku**: Push to Heroku, auto-deploys
- **Railway**: Connect GitHub repo, auto-deploys  
- **Vercel**: Deploy as serverless function
- **AWS/GCP/Azure**: Use container services

### 3. Self-Hosted
- Deploy on your own server
- Use Docker for easy deployment
- Add reverse proxy (nginx) for production

## Security Considerations

- **Authentication**: Add API keys or OAuth for production
- **Rate Limiting**: Prevent abuse of the API
- **CORS**: Configure allowed origins
- **Input Validation**: Validate all incoming data
- **Error Handling**: Don't expose sensitive information

## Scaling Considerations

- **Database**: Replace in-memory storage with PostgreSQL
- **Caching**: Add Redis for diagram caching
- **Load Balancing**: Multiple server instances
- **CDN**: Serve static visualizations from CDN
- **Monitoring**: Add logging and metrics
