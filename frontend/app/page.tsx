'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [magnetLink, setMagnetLink] = useState('')

  // Handle torrent/magnet link submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement API call to backend
    console.log('Submitting magnet link:', magnetLink)
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-2">Seedr Clone</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Convert torrents to direct download links
          </p>
        </header>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="mb-4">
              <label 
                htmlFor="magnet" 
                className="block text-sm font-medium mb-2"
              >
                Magnet Link or Torrent File
              </label>
              <input
                type="text"
                id="magnet"
                value={magnetLink}
                onChange={(e) => setMagnetLink(e.target.value)}
                placeholder="magnet:?xt=urn:btih:..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Start Download
            </button>
          </form>

          {/* Navigation Links */}
          <div className="flex gap-4 justify-center">
            <Link 
              href="/login" 
              className="text-primary-600 hover:underline"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="text-primary-600 hover:underline"
            >
              Register
            </Link>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Upload a magnet link or torrent file to start downloading</p>
        </div>
      </div>
    </main>
  )
}

