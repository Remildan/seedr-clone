const cron = require('node-cron')
const torrentService = require('./torrentService')

/**
 * Configure and start the auto-delete cron job
 * Runs every hour to clean up old torrents
 */
const startAutoDelete = () => {
    console.log('⏳ Auto-delete service scheduled (every hour)')

    // Schedule: 0 * * * * (Every hour at minute 0)
    cron.schedule('0 * * * *', () => {
        console.log('🧹 Running auto-delete cleanup...')

        try {
            const torrents = torrentService.getAllTorrents()
            const now = Date.now()
            const SIX_HOURS_MS = 6 * 60 * 60 * 1000

            let deletedCount = 0

            torrents.forEach(torrent => {
                const elapsed = now - torrent.createdAt

                if (elapsed > SIX_HOURS_MS) {
                    console.log(`🗑️ Deleting expired torrent: ${torrent.id} (Age: ${(elapsed / 1000 / 60).toFixed(1)} min)`)
                    torrentService.removeTorrent(torrent.id)
                    deletedCount++
                }
            })

            if (deletedCount > 0) {
                console.log(`✅ Cleanup complete. Removed ${deletedCount} expired torrents.`)
            } else {
                console.log('✅ Cleanup complete. No expired torrents found.')
            }

        } catch (error) {
            console.error('❌ Error during auto-delete cleanup:', error)
        }
    })
}

module.exports = { startAutoDelete }
