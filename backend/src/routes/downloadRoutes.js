const express = require('express')
const router = express.Router()
const { authenticateToken: verifyToken } = require('../../middleware/auth')
const path = require('path')
const fs = require('fs')

/**
 * Secure file download route
 * GET /download/:torrentId/:fileName
 */
router.get('/download/:torrentId/:fileName', verifyToken, (req, res) => {
    const { torrentId, fileName } = req.params

    // Construct valid storage root path
    // Assuming backend/storage relative to backend/src/routes/ is ../../storage
    const storageRoot = path.join(__dirname, '../../storage')

    // Construct full file path
    const filePath = path.join(storageRoot, torrentId, fileName)

    console.log(`Attempting download: ${filePath}`)

    // Security: Prevent directory traversal
    // path.resolve must start with storageRoot
    const resolvedPath = path.resolve(filePath)
    const resolvedRoot = path.resolve(storageRoot)

    if (!resolvedPath.startsWith(resolvedRoot)) {
        console.warn('Blocked path traversal attempt:', filePath)
        return res.status(403).json({ error: 'Access denied' })
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' })
    }

    // Send file
    res.download(filePath, fileName, (err) => {
        if (err) {
            console.error('File download error:', err)
            // Only send error if headers haven't been sent
            if (!res.headersSent) {
                res.status(500).json({ error: 'Could not download file' })
            }
        }
    })
})

module.exports = router
