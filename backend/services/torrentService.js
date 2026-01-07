const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs').promises

// WebTorrent is an ESM module, so we use dynamic import
let WebTorrent
let client

// Initialize WebTorrent client (single instance for the app)
// This runs asynchronously to avoid blocking the event loop
(async () => {
  try {
    WebTorrent = (await import('webtorrent')).default
    client = new WebTorrent()
    console.log('✅ WebTorrent client initialized')
  } catch (error) {
    console.error('❌ Failed to initialize WebTorrent:', error)
  }
})()

// In-memory storage for torrent state
// Structure: { torrentId: { status, progress, downloaded, total, speed, ... } }
const torrentStates = new Map()

// Socket.io instance (will be set by setSocketIO)
let io = null

/**
 * Set Socket.io instance for emitting progress updates
 * Call this when Socket.io server is initialized
 * 
 * @param {Object} socketIO - Socket.io server instance
 */
const setSocketIO = (socketIO) => {
  io = socketIO
}

/**
 * Start downloading a torrent from a magnet link
 * 
 * This function:
 * 1. Generates a unique torrentId using UUID
 * 2. Creates storage directory for the torrent
 * 3. Adds torrent to WebTorrent client
 * 4. Tracks progress and emits updates via Socket.io
 * 5. Handles errors gracefully
 * 
 * @param {string} magnetLink - Magnet link to download
 * @param {string} userId - User ID who owns this torrent
 * @returns {Promise<Object>} - { torrentId, status: 'downloading' }
 */
const startTorrent = async (magnetLink, userId) => {
  // Validate WebTorrent client is initialized
  if (!client) {
    throw new Error('WebTorrent client not initialized')
  }

  // Generate unique torrent ID using UUID
  const torrentId = uuidv4()

  // Create storage directory for this torrent: /storage/{torrentId}
  const storagePath = path.join(__dirname, '..', 'storage', torrentId)
  try {
    await fs.mkdir(storagePath, { recursive: true })
  } catch (error) {
    console.error(`Failed to create storage directory for ${torrentId}:`, error)
    throw new Error('Failed to create storage directory')
  }

  // Initialize torrent state in memory
  torrentStates.set(torrentId, {
    torrentId,
    userId,
    magnetLink,
    status: 'downloading',
    progress: 0,
    downloaded: 0,
    total: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    files: [],
    error: null,
    createdAt: new Date(),
  })

  // Add torrent to WebTorrent client
  // This is non-blocking - WebTorrent handles downloads asynchronously
  client.add(magnetLink, { path: storagePath }, (torrent) => {
    const state = torrentStates.get(torrentId)
    if (!state) return // Torrent was removed

    // Update state with torrent metadata
    state.total = torrent.length || 0
    state.files = torrent.files.map(file => ({
      name: file.name,
      path: file.path,
      length: file.length,
    }))

    // Emit initial state
    emitProgress(torrentId, state)

    // Track download progress
    // Use setInterval for periodic updates (non-blocking)
    const progressInterval = setInterval(() => {
      if (!torrentStates.has(torrentId)) {
        clearInterval(progressInterval)
        return
      }

      const currentState = torrentStates.get(torrentId)
      if (!currentState) {
        clearInterval(progressInterval)
        return
      }

      // Update progress metrics (non-blocking calculations)
      currentState.progress = Math.round(torrent.progress * 100)
      currentState.downloaded = torrent.downloaded
      currentState.total = torrent.length || 0
      currentState.downloadSpeed = torrent.downloadSpeed || 0
      currentState.uploadSpeed = torrent.uploadSpeed || 0

      // Emit progress update via Socket.io
      emitProgress(torrentId, currentState)
    }, 2000) // Update every 2 seconds

    // Handle torrent completion
    torrent.on('done', () => {
      const finalState = torrentStates.get(torrentId)
      if (!finalState) return

      finalState.status = 'completed'
      finalState.progress = 100
      finalState.downloaded = torrent.downloaded
      finalState.downloadSpeed = 0
      finalState.uploadSpeed = 0

      clearInterval(progressInterval)
      emitProgress(torrentId, finalState)
      console.log(`✅ Torrent ${torrentId} completed`)
    })

    // Handle torrent errors gracefully
    torrent.on('error', (error) => {
      const errorState = torrentStates.get(torrentId)
      if (!errorState) return

      errorState.status = 'error'
      errorState.error = error.message
      clearInterval(progressInterval)
      
      emitProgress(torrentId, errorState)
      console.error(`❌ Torrent ${torrentId} error:`, error.message)
    })
  })

  // Return initial state
  return {
    torrentId,
    status: 'downloading',
  }
}

/**
 * Get current status of a torrent
 * 
 * @param {string} torrentId - UUID of the torrent
 * @returns {Object|null} - Torrent state or null if not found
 */
const getTorrentStatus = (torrentId) => {
  const state = torrentStates.get(torrentId)
  if (!state) {
    return null
  }

  // Return a copy to prevent external mutations
  return {
    torrentId: state.torrentId,
    userId: state.userId,
    magnetLink: state.magnetLink,
    status: state.status,
    progress: state.progress,
    downloaded: state.downloaded,
    total: state.total,
    downloadSpeed: state.downloadSpeed,
    uploadSpeed: state.uploadSpeed,
    files: [...state.files],
    error: state.error,
    createdAt: state.createdAt,
  }
}

/**
 * Emit progress update via Socket.io
 * Emits to user-specific room and torrent-specific room
 * 
 * @param {string} torrentId - UUID of the torrent
 * @param {Object} state - Current torrent state
 */
const emitProgress = (torrentId, state) => {
  if (!io) {
    // Socket.io not initialized yet, skip emission
    return
  }

  try {
    // Emit to user-specific room
    io.to(`user:${state.userId}`).emit('torrent:progress', {
      torrentId,
      ...state,
    })

    // Emit to torrent-specific room
    io.to(`torrent:${torrentId}`).emit('torrent:progress', {
      torrentId,
      ...state,
    })
  } catch (error) {
    console.error(`Failed to emit progress for ${torrentId}:`, error)
  }
}

/**
 * Remove a torrent from WebTorrent client and memory
 * 
 * @param {string} torrentId - UUID of the torrent
 */
const removeTorrent = (torrentId) => {
  if (!client) return

  // Find torrent in WebTorrent client by checking all torrents
  const torrent = Array.from(client.torrents).find(t => {
    // Match by checking if storage path contains torrentId
    return t.path && t.path.includes(torrentId)
  })

  if (torrent) {
    // Remove from WebTorrent client (stops download)
    client.remove(torrent, (err) => {
      if (err) {
        console.error(`Error removing torrent ${torrentId}:`, err)
      }
    })
  }

  // Remove from memory
  torrentStates.delete(torrentId)
}

/**
 * Get all torrents for a specific user
 * 
 * @param {string} userId - User ID
 * @returns {Array} - Array of torrent states
 */
const getUserTorrents = (userId) => {
  return Array.from(torrentStates.values())
    .filter(state => state.userId === userId)
    .map(state => getTorrentStatus(state.torrentId))
}

module.exports = {
  startTorrent,
  getTorrentStatus,
  setSocketIO,
  removeTorrent,
  getUserTorrents,
}

