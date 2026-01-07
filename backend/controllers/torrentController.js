const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
const torrentService = require('../src/services/torrentService')

/**
 * Add a new torrent (magnet link)
 * POST /api/torrent
 * 
 * Request body: { magnet: "magnet:?xt=..." }
 * Response: { message, torrent: { id, magnet, status, progress, ... } }
 */
const addTorrent = async (req, res) => {
  try {
    const { magnet } = req.body
    const userId = req.userId // From auth middleware

    // Validate input
    if (!magnet) {
      return res.status(400).json({ error: 'Magnet link is required' })
    }

    // Create torrent record in database
    const torrent = await prisma.torrent.create({
      data: {
        magnet,
        userId,
        status: 'downloading',
        progress: 0,
      },
    })

    // Start downloading via service
    // Pass the persisted torrent ID
    try {
      await torrentService.startTorrent(magnet, userId, torrent.id)
    } catch (err) {
      console.error('Failed to start torrent in service:', err)
      await prisma.torrent.update({
        where: { id: torrent.id },
        data: { status: 'error' }
      })
      // We still return 201 because the record was created, but status is error
    }

    res.status(201).json({
      message: 'Torrent added successfully',
      torrent,
    })
  } catch (error) {
    console.error('Add torrent error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Get all torrents for the authenticated user
 * GET /api/torrent
 * 
 * Response: { torrents: [...] }
 */
const getTorrents = async (req, res) => {
  try {
    const userId = req.userId

    // Get all torrents for this user, including their files
    const torrents = await prisma.torrent.findMany({
      where: { userId },
      include: {
        files: true, // Include files in the response
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ torrents })
  } catch (error) {
    console.error('Get torrents error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Get a specific torrent by ID
 * GET /api/torrent/:id
 * 
 * Response: { torrent: { id, magnet, status, progress, files, ... } }
 */
const getTorrentById = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    // Find torrent and verify ownership
    const torrent = await prisma.torrent.findFirst({
      where: {
        id,
        userId, // Ensure user owns this torrent
      },
      include: {
        files: true, // Include files in the response
      },
    })

    if (!torrent) {
      return res.status(404).json({ error: 'Torrent not found' })
    }

    res.json({ torrent })
  } catch (error) {
    console.error('Get torrent error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * Delete a torrent
 * DELETE /api/torrent/:id
 * 
 * Response: { message: "Torrent deleted successfully" }
 */
const deleteTorrent = async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.userId

    // Find torrent and verify ownership
    const torrent = await prisma.torrent.findFirst({
      where: {
        id,
        userId,
      },
    })

    if (!torrent) {
      return res.status(404).json({ error: 'Torrent not found' })
    }

    // Stop and remove in service
    torrentService.removeTorrent(id)

    // Delete from database
    await prisma.torrent.delete({
      where: { id },
    })

    res.json({ message: 'Torrent deleted successfully' })
  } catch (error) {
    console.error('Delete torrent error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = {
  addTorrent,
  getTorrents,
  getTorrentById,
  deleteTorrent,
}
