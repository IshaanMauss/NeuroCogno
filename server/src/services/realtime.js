let ioRef = null;

export function setSocketServer(io) {
  ioRef = io;
}

/**
 * Emit update to admin dashboard
 */
export function emitAdminUpdate(event, payload = {}) {
  if (!ioRef) return;
  const envelope = {
    type: event,
    data: payload,
    emittedAt: new Date().toISOString()
  };
  // Emit under the literal event name (what the admin dashboard's
  // socket.on('lead:created', ...) / socket.on('system:issue', ...) listeners
  // actually listen for) as well as the generic 'admin:update' wrapper, for
  // any future listener that wants the envelope form. Previously only the
  // wrapper was sent, so none of the dashboard's live-refresh listeners ever
  // fired and it only ever updated on a manual reload.
  ioRef.to('admins').emit(event, payload);
  ioRef.to('admins').emit('admin:update', envelope);
}

/**
 * Broadcast an update to every connected socket, admin or public. Use only
 * for events that are already public information (e.g. CMS content changes,
 * which anyone can already read via the unauthenticated /api/public/site-content
 * endpoint) — never for lead/payment/system-issue data, which must stay
 * admins-only.
 */
export function emitPublicUpdate(event, payload = {}) {
  if (!ioRef) return;
  ioRef.emit(event, payload);
}

/**
 * Emit notification to specific user
 */
export function emitUserNotification(profileId, payload = {}) {
  if (!ioRef) return;
  const room = `profile:${profileId}`;
  ioRef.to(room).emit('notification', {
    ...payload,
    emittedAt: new Date().toISOString()
  });
}

/**
 * Emit session update to user
 */
export function emitSessionUpdate(profileId, payload = {}) {
  if (!ioRef) return;
  const room = `profile:${profileId}`;
  ioRef.to(room).emit('session:update', {
    ...payload,
    emittedAt: new Date().toISOString()
  });
}

/**
 * Emit payment update to user
 */
export function emitPaymentUpdate(profileId, payload = {}) {
  if (!ioRef) return;
  const room = `profile:${profileId}`;
  ioRef.to(room).emit('payment:update', {
    ...payload,
    emittedAt: new Date().toISOString()
  });
}

/**
 * Get socket server instance
 */
export function getSocketServer() {
  return ioRef;
}
