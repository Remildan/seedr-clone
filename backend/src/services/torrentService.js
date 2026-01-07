// WebTorrent is dynamic imported below
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs')

// In-memory stickiness
const torrentStates = {}

/**
 * We need to dynamically import WebTorrent since it's ESM only in newer versions,
 * or we can use the require if we are in CJS and version allows. 
 * The prompt says "Initialize a WebTorrent client". 
 * In the previous steps we saw `import('webtorrent')` was needed.
 * We will assume dynamic import is safest pattern here.
 */
let clientInstance = null

async function getClient() {
    if (clientInstance) return clientInstance
    const { default: WebTorrent } = await import('webtorrent')
    clientInstance = new WebTorrent()
    return clientInstance
}

/**
 * Start a torrent download
 * @param {string} magnet - Magnet URI
 * @param {object} io - Socket.io instance
 * @returns {Promise<object>} - { torrentId, message }
 */
const startTorrent = async (magnet, io) => {
    const client = await getClient()
    const torrentId = uuidv4()

    // Storage path: backend/storage/{torrentId}
    // Assuming this file is in backend/src/services/torrentService.js
    const storagePath = path.join(__dirname, '../../storage', torrentId)

    // Ensure storage exists
    if (!fs.existsSync(storagePath)) {
        fs.mkdirSync(storagePath, { recursive: true })
    }

    // Initial state
    torrentStates[torrentId] = {
        id: torrentId,
        progress: 0,
        downloaded: 0,
        total: 0,
        downloadSpeed: 0,
        status: 'initializing',
        createdAt: Date.now()
    }

    client.add(magnet, { path: storagePath }, (torrent) => {
        // On metadata
        const files = torrent.files.map(file => ({
            name: file.name,
            path: file.path,
            length: file.length
        }))

        torrentStates[torrentId].status = 'downloading'
        torrentStates[torrentId].total = torrent.length
        torrentStates[torrentId].files = files
        // Store torrent instance for destruction
        torrentStates[torrentId].instance = torrent

        // Progress Interval
        const interval = setInterval(() => {
            if (torrent.destroyed) {
                clearInterval(interval)
                return
            }

            const progress = Math.round(torrent.progress * 100)
            const downloadSpeed = torrent.downloadSpeed
            const downloaded = torrent.downloaded

            // Update state
            torrentStates[torrentId] = {
                ...torrentStates[torrentId],
                progress,
                downloaded,
                downloadSpeed,
                status: progress >= 100 ? 'completed' : 'downloading'
            }

            // Emit event: torrent-progress
            if (io) {
                io.emit('torrent-progress', {
                    torrentId,
                    ...torrentStates[torrentId],
                    instance: undefined // Don't send cyclic object to socket
                })
            }

            // Cleanup on completion
            if (progress >= 100) {
                clearInterval(interval)
                torrentStates[torrentId].status = 'completed'
                // Emit final state of completed
                if (io) {
                    io.emit('torrent-progress', {
                        torrentId,
                        ...torrentStates[torrentId],
                        instance: undefined
                    })
                }
            }
        }, 1000)

        torrent.on('error', (err) => {
            console.error(`Torrent ${torrentId} error:`, err)
            torrentStates[torrentId].status = 'error'
            torrentStates[torrentId].error = err.message
            clearInterval(interval)
        })
    })

    return { torrentId, message: 'Download started' }
}

/**
 * Get the status of a specific torrent
 * @param {string} torrentId 
 * @returns {object} status object
 */
const getTorrentStatus = (torrentId) => {
    const state = torrentStates[torrentId]
    if (!state) return null
    // Return safe copy without instance
    const { instance, ...safeState } = state
    return safeState
}

/**
 * Get all torrents (shallow copy)
 */
const getAllTorrents = () => {
    return Object.values(torrentStates).map(state => {
        const { instance, ...safeState } = state
        return safeState
    })
}

/**
 * Remove a torrent and delete its files
 * @param {string} torrentId 
 */
const removeTorrent = (torrentId) => {
    const state = torrentStates[torrentId]
    if (!state) return

    // Destroy web torrent instance
    if (state.instance) {
        state.instance.destroy()
    }

    // Delete files logic should be here or handled by caller? 
    // Requirement says "Delete files inside /storage/{torrentId}" in cron job.
    // Ideally service handles "removeTorrent" which implies cleanup.
    // Let's implement full cleanup here.

    try {
        const storagePath = path.join(__dirname, '../../storage', torrentId)
        if (fs.existsSync(storagePath)) {
            fs.rmSync(storagePath, { recursive: true, force: true })
        }
    } catch (err) {
        console.error(`Failed to delete storage for ${torrentId}:`, err)
    }

    delete torrentStates[torrentId]
}

/**
 * Inject a fake torrent for testing purposes
 */
const _injectTestTorrent = (id, data) => {
    torrentStates[id] = data
}

module.exports = {
    startTorrent,
    getTorrentStatus,
    getAllTorrents,
    removeTorrent,
    _injectTestTorrent
}
