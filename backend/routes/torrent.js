const express = require('express')
const { authenticateToken } = require('../middleware/auth')
const { 
  addTorrent, 
  getTorrents, 
  getTorrentById, 
  deleteTorrent 
} = require('../controllers/torrentController')

const router = express.Router()

// All torrent routes require authentication
router.use(authenticateToken)

/**
 * POST /api/torrent
 * Add a new torrent (magnet link)
 * 
 * Request body: { magnet: "magnet:?xt=..." }
 * Response: { message, torrent }
 */
router.post('/', addTorrent)

/**
 * GET /api/torrent
 * Get all torrents for the authenticated user
 * 
 * Response: { torrents: [...] }
 */
router.get('/', getTorrents)

/**
 * GET /api/torrent/:id
 * Get a specific torrent by ID
 * 
 * Response: { torrent: {...} }
 */
router.get('/:id', getTorrentById)

/**
 * DELETE /api/torrent/:id
 * Delete a torrent
 * 
 * Response: { message: "Torrent deleted successfully" }
 */
router.delete('/:id', deleteTorrent)

module.exports = router

