/**
 * ============================================================================
 * SOCKET SERVICE - Real-time Dashboard Updates
 * ============================================================================
 * 
 * Uses Socket.IO to push real-time event updates to connected dashboard clients.
 * This allows the dashboard to show live tracking data as it flows through.
 */

let io = null;

/**
 * Initialize Socket.IO with the server instance
 */
export function initializeSocketIO(socketIO) {
  io = socketIO;

  io.on('connection', (socket) => {
    console.log(`[SOCKET] Client connected: ${socket.id}`);

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to SST Dashboard',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // Handle client subscribing to specific event types
    socket.on('subscribe', (eventTypes) => {
      if (Array.isArray(eventTypes)) {
        eventTypes.forEach(type => socket.join(`event:${type}`));
        console.log(`[SOCKET] Client ${socket.id} subscribed to: ${eventTypes.join(', ')}`);
      }
    });

    // Handle unsubscribe
    socket.on('unsubscribe', (eventTypes) => {
      if (Array.isArray(eventTypes)) {
        eventTypes.forEach(type => socket.leave(`event:${type}`));
      }
    });

    // Handle ping for latency measurement
    socket.on('ping', (callback) => {
      if (typeof callback === 'function') {
        callback(Date.now());
      }
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[SOCKET] Client disconnected: ${socket.id} (${reason})`);
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`[SOCKET] Error for client ${socket.id}:`, error);
    });
  });

  console.log('[SOCKET] Socket.IO initialized');
}

/**
 * Emit an event to all connected clients
 */
export function emitEvent(eventType, data) {
  if (!io) {
    console.warn('[SOCKET] Socket.IO not initialized');
    return;
  }

  const payload = {
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  };

  // Emit to all connected clients
  io.emit(eventType, payload);

  // Also emit to specific room if exists
  io.to(`event:${eventType}`).emit(eventType, payload);

  console.log(`[SOCKET] Emitted ${eventType} to ${io.engine.clientsCount} clients`);
}

/**
 * Emit to specific client
 */
export function emitToClient(socketId, eventType, data) {
  if (!io) {
    console.warn('[SOCKET] Socket.IO not initialized');
    return;
  }

  io.to(socketId).emit(eventType, {
    type: eventType,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get connected client count
 */
export function getConnectedClients() {
  if (!io) return 0;
  return io.engine.clientsCount;
}

/**
 * Broadcast server status
 */
export function broadcastServerStatus(status) {
  emitEvent('server:status', status);
}
