'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { io, Socket } from 'socket.io-client'
import api from '../../lib/api'

interface File {
    name: string
    length: number
}

interface Torrent {
    id: string
    status: string
    progress: number
    downloaded: number
    total: number
    downloadSpeed: number
    files?: File[]
    name?: string // Optional, might be in file list
}

export default function DashboardPage() {
    const router = useRouter()
    const [user, setUser] = useState<{ email: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const [magnet, setMagnet] = useState('')
    const [torrents, setTorrents] = useState<{ [key: string]: Torrent }>({})
    const [error, setError] = useState('')
    const socketRef = useRef<Socket | null>(null)

    // Initialize User and Socket
    useEffect(() => {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')

        if (!token) {
            router.push('/login')
            return
        }

        if (userStr) {
            try {
                setUser(JSON.parse(userStr))
            } catch (e) {
                console.error('Failed to parse user data', e)
            }
        }

        // Connect Socket.io
        // Assuming backend is at http://localhost:5000 based on previous steps
        const socket = io('http://localhost:5000', {
            auth: {
                token: token // Sending token for auth middleware if backend supports it in handshake or extraHeaders
                // My backend socket.js uses: const token = socket.handshake.auth.token
            }
        })

        socket.on('connect', () => {
            console.log('Socket connected')
            setError('')
        })

        socket.on('connect_error', (err) => {
            console.error('Socket connection error:', err)
            setError('Real-time connection failed')
        })

        socket.on('torrent-progress', (data: Torrent & { torrentId: string }) => {
            setTorrents(prev => ({
                ...prev,
                [data.torrentId]: {
                    ...prev[data.torrentId],
                    ...data,
                    id: data.torrentId
                }
            }))
        })

        socketRef.current = socket
        setLoading(false)

        return () => {
            socket.disconnect()
        }
    }, [router])

    const handleLogout = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        if (socketRef.current) socketRef.current.disconnect()
        router.push('/login')
    }

    const handleAddTorrent = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!magnet) return
        setError('')

        try {
            const { data } = await api.post('/torrent/magnet', { magnet })
            console.log('Torrent added:', data)
            setMagnet('')

            // Initialize local state immediately
            setTorrents(prev => ({
                ...prev,
                [data.torrentId]: {
                    id: data.torrentId,
                    status: 'initializing',
                    progress: 0,
                    downloaded: 0,
                    total: 0,
                    downloadSpeed: 0
                }
            }))
        } catch (err: any) {
            console.error('Add torrent error:', err)
            setError(err.response?.data?.error || 'Failed to add torrent')
        }
    }

    const fetchFiles = async (torrentId: string) => {
        try {
            const { data } = await api.get(`/torrent/${torrentId}/files`)
            setTorrents(prev => ({
                ...prev,
                [torrentId]: {
                    ...prev[torrentId],
                    files: data.files
                }
            }))
        } catch (err) {
            console.error('Fetch files error:', err)
        }
    }

    const handleDownload = async (torrentId: string, fileName: string) => {
        const token = localStorage.getItem('token')
        if (!token) return

        // Trigger download by URL opening
        // We can't use easy 'download' attribute for auth-protected routes easily without fetch + blob.
        // However, user requirement 4 says "Use anchor tag with 'download' attribute OR axios + blob"
        // AND "Download button calls /download/:torrentId/:fileName with JWT token"

        // Simplest way with Auth header is axios -> blob -> url
        try {
            const response = await api.get(`/download/${torrentId}/${encodeURIComponent(fileName)}`, {
                responseType: 'blob'
            })

            // Create blob link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (err) {
            console.error('Download error:', err)
            alert('Failed to download file')
        }
    }

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    if (loading) return <div className="p-8">Loading...</div>

    return (
        <main className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <header className="flex justify-between items-center mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
                            Cloud Torrent
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Logged in as {user?.email}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500/10 text-red-600 hover:bg-red-500/20 px-4 py-2 rounded-lg transition-colors font-medium text-sm border border-red-200 dark:border-red-900"
                    >
                        Logout
                    </button>
                </header>

                {/* Add Magnet Form */}
                <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                    <form onSubmit={handleAddTorrent} className="flex gap-4">
                        <input
                            type="text"
                            value={magnet}
                            onChange={(e) => setMagnet(e.target.value)}
                            placeholder="Paste Magnet Link here..."
                            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/30"
                        >
                            Start Download
                        </button>
                    </form>
                    {error && <div className="mt-4 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900">{error}</div>}
                </div>

                {/* Torrents List */}
                <div className="grid gap-6">
                    {Object.values(torrents).map((torrent) => (
                        <div key={torrent.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 break-all mb-1">
                                            {torrent.id}
                                        </h3>
                                        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wider
                                ${torrent.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    torrent.status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                                {torrent.status}
                                            </span>
                                            <span>{formatBytes(torrent.downloadSpeed)}/s</span>
                                            <span>{formatBytes(torrent.downloaded)} / {formatBytes(torrent.total)}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-2xl font-bold text-gray-700 dark:text-gray-300">{torrent.progress}%</span>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
                                    <div
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                                        style={{ width: `${torrent.progress}%` }}
                                    />
                                </div>

                                {/* Files Section */}
                                <div className="mt-6 border-t border-gray-100 dark:border-gray-700 pt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wide">Files</h4>
                                        {!torrent.files && (
                                            <button
                                                onClick={() => fetchFiles(torrent.id)}
                                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                            >
                                                Load Files
                                            </button>
                                        )}
                                    </div>

                                    {torrent.files && (
                                        <div className="space-y-2">
                                            {torrent.files.map((file, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded text-blue-600 dark:text-blue-400">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate text-gray-700 dark:text-gray-200">{file.name}</p>
                                                            <p className="text-xs text-gray-500">{formatBytes(file.length)}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDownload(torrent.id, file.name)}
                                                        className="ml-4 p-2 text-gray-500 hover:text-blue-600 transition-colors"
                                                        title="Download"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {Object.keys(torrents).length === 0 && (
                        <div className="text-center py-12 text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <p>No active downloads</p>
                        </div>
                    )}
                </div>
            </div>
        </main>
    )
}
