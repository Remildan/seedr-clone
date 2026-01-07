import { io, Socket } from 'socket.io-client'

// Socket.io client configuration
// Handles real-time updates from the backend

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000'

let socket: Socket | null = null

/**
 * Initialize Socket.io connection
 * @param token - JWT token for authentication
 */
export const initSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket
  }

  socket = io(SOCKET_URL, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('Connected to server via Socket.io')
  })

  socket.on('disconnect', () => {
    console.log('Disconnected from server')
  })

  socket.on('error', (error) => {
    console.error('Socket error:', error)
  })

  return socket
}

/**
 * Get current socket instance
 */
export const getSocket = (): Socket | null => {
  return socket
}

/**
 * Disconnect socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Subscribe to torrent updates
 * @param torrentId - ID of the torrent to subscribe to
 */
export const subscribeToTorrent = (torrentId: string) => {
  if (socket) {
    socket.emit('torrent:subscribe', torrentId)
  }
}

/**
 * Unsubscribe from torrent updates
 * @param torrentId - ID of the torrent to unsubscribe from
 */
export const unsubscribeFromTorrent = (torrentId: string) => {
  if (socket) {
    socket.emit('torrent:unsubscribe', torrentId)
  }
}

