import express from 'express'
import { authenticateToken } from '../middleware/auth'
import { 
  addTorrent, 
  getTorrents, 
  getTorrentById, 
  deleteTorrent 
} from '../controllers/torrentController'

const router = express.Router()

// All torrent routes require authentication
router.use(authenticateToken)

/**
 * POST /api/torrent
 * Add a new torrent (magnet link or file)
 */
router.post('/', addTorrent)

/**
 * GET /api/torrent
 * Get all torrents for the authenticated user
 */
router.get('/', getTorrents)

/**
 * GET /api/torrent/:id
 * Get a specific torrent by ID
 */
router.get('/:id', getTorrentById)

/**
 * DELETE /api/torrent/:id
 * Delete a torrent
 */
router.delete('/:id', deleteTorrent)

export default router

