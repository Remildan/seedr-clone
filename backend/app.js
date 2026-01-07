const express = require('express')
const cors = require('cors')

// Create Express app
const app = express()

// Enable CORS - allows requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

// JSON body parser middleware
// This allows Express to parse JSON request bodies
app.use(express.json())

// URL-encoded body parser middleware
// This allows Express to parse form data
app.use(express.urlencoded({ extended: true }))

// Health check route
// Used to verify the server is running
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString()
  })
})

// Root Route (for easier verification)
app.get('/', (req, res) => {
  res.send('Seedr Clone Backend is Running')
})

// Import and use auth routes
const authRoutes = require('./routes/auth')
app.use('/api/auth', authRoutes)

// Import and use torrent routes (protected - requires authentication)
// Import and use torrent routes (protected - requires authentication)
// Note: Route path relative to app.js in backend/
const torrentRoutes = require('./src/routes/torrentRoutes')
// Mount at /api so we get /api/torrent/magnet etc if router handles /torrent/magnet
// Wait, router handles /torrent/magnet. If we mount at /api, we get /api/torrent/magnet.
// Matches requirement.
app.use('/api', torrentRoutes)

const downloadRoutes = require('./src/routes/downloadRoutes')
app.use('/api', downloadRoutes)

// Export app for use in server.js
module.exports = app

