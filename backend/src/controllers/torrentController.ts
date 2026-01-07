import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import WebTorrent from 'webtorrent'

const prisma = new PrismaClient()

// Initialize WebTorrent client (single instance for the app)
const client = new WebTorrent()

/**
 * Add a new torrent (magnet link)
 * POST /api/torrent
 */
export const addTorrent = async (req: Request, res: Response) => {
  try {
    const { magnet } = req.body
    const userId = req.userId // From auth middleware

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

    // Add torrent to WebTorrent client
    // This will start downloading the torrent
    client.add(magnet, (webtorrent) => {
      // Update torrent status when download completes
      webtorrent.on('done', async () => {
        // Create File records for each file in the torrent
        const files = webtorrent.files.map(file => ({
          name: file.name,
          size: file.length,
          path: file.path,
        }))

        await prisma.torrent.update({
          where: { id: torrent.id },
          data: { 
            status: 'completed',
            progress: 100,
            files: {
              create: files,
            },
          },
        })
      })

      // Handle errors
      webtorrent.on('error', async (err) => {
        console.error('Torrent error:', err)
        await prisma.torrent.update({
          where: { id: torrent.id },
          data: { status: 'error' },
        })
      })

      // Update progress periodically
      const progressInterval = setInterval(async () => {
        const progress = webtorrent.progress * 100
        await prisma.torrent.update({
          where: { id: torrent.id },
          data: {
            progress,
          },
        }).catch(console.error)
      }, 2000) // Update every 2 seconds

      // Clear interval when torrent is done or removed
      webtorrent.on('done', () => clearInterval(progressInterval))
      webtorrent.on('destroy', () => clearInterval(progressInterval))
    })

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
 */
export const getTorrents = async (req: Request, res: Response) => {
  try {
    const userId = req.userId

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
 */
export const getTorrentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.userId

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
 */
export const deleteTorrent = async (req: Request, res: Response) => {
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

    // Remove from WebTorrent client if active (find by magnet link)
    const webtorrent = client.torrents.find(t => t.magnetURI === torrent.magnet)
    if (webtorrent) {
      client.remove(webtorrent)
    }

    // Delete from database (files will be deleted automatically due to cascade)
    await prisma.torrent.delete({
      where: { id },
    })

    res.json({ message: 'Torrent deleted successfully' })
  } catch (error) {
    console.error('Delete torrent error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

