import { handle } from '../../db/index.js'
import { Message } from '../../models/Message.js'

// The model becomes a live REST + MCP resource with zero extra wiring:
//   GET  /api/messages       · MCP tool messages_list
//   GET  /api/messages/:id   · MCP tool messages_get
//   POST /api/messages       · MCP tool messages_create   (+ update / delete)
export default Message.resource(handle)
