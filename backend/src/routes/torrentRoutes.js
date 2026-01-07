const express = require('express')
const router = express.Router()
const torrentService = require('../services/torrentService')
const { authenticateToken } = require('../../middleware/auth') // relative from src/routes to middleware

router.post('/torrent/magnet', authenticateToken, async (req, res) => {
    const { magnet } = req.body
    if (!magnet) {
        return res.status(400).json({ error: 'Magnet link is required' })
    }

    try {
        // Dynamic require to avoid circular dependency at load time
        // Path: backend/src/routes/ -> ../../server
        const { io } = require('../../server')

        if (!io) {
            console.warn('Socket.io instance not found in server export')
        }

        const result = await torrentService.startTorrent(magnet, io)

        // Result: { torrentId, message }
        res.json(result)
    } catch (err) {
        console.error('Start torrent error:', err)
        res.status(500).json({ error: err.message })
    }
})

router.get('/torrent/:id/status', authenticateToken, (req, res) => {
    const { id } = req.params
    const status = torrentService.getTorrentStatus(id)

    if (!status) {
        return res.status(404).json({ error: 'Torrent not found' })
    }

    // Requirement: Return current progress
    res.json(status)
})

router.get('/torrent/:id/files', authenticateToken, (req, res) => {
    const { id } = req.params
    const status = torrentService.getTorrentStatus(id)

    if (!status) {
        return res.status(404).json({ error: 'Torrent not found' })
    }

    // Check if files exist on status object.
    res.json({ files: status.files || [] })
})

module.exports = router
