# Seedr Clone - Torrent to Direct Download

A Seedr-style web application that converts torrents to direct download links using free tools.

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: Node.js + Express
- **Torrent**: WebTorrent (server-side)
- **Database**: PostgreSQL (Neon) + Prisma ORM
- **Realtime**: Socket.io
- **Authentication**: JWT
- **Hosting**: Vercel (frontend), Render (backend)

## Project Structure

```
seedr-clone/
├── frontend/          # Next.js application
├── backend/           # Express API server
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (Neon free tier recommended)
- npm or yarn

### Installation

1. Install all dependencies:
```bash
npm run install:all
```

2. Set up environment variables:

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

**Backend** (`backend/.env`):
```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

3. Set up database:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

4. Run development servers:
```bash
# Run both frontend and backend
npm run dev

# Or run separately
npm run dev:frontend
npm run dev:backend
```

## Development

- Frontend runs on: http://localhost:3000
- Backend API runs on: http://localhost:5000

## Project Structure Details

```
seedr-clone/
├── frontend/
│   ├── app/              # Next.js App Router pages
│   │   ├── page.tsx      # Home page
│   │   ├── login/        # Login page
│   │   └── register/     # Registration page
│   ├── lib/              # Utility functions
│   │   ├── api.ts        # API client
│   │   └── socket.ts     # Socket.io client
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── server.ts     # Express server entry point
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth middleware
│   │   └── socket/       # Socket.io handlers
│   ├── prisma/
│   │   └── schema.prisma # Database schema
│   └── package.json
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Torrents (requires authentication)
- `POST /api/torrent` - Add new torrent
- `GET /api/torrent` - Get all user's torrents
- `GET /api/torrent/:id` - Get specific torrent
- `DELETE /api/torrent/:id` - Delete torrent

## Features

- ✅ User authentication (JWT)
- ✅ Torrent management (add, list, delete)
- ✅ Real-time updates via Socket.io
- ✅ WebTorrent integration for downloading
- ✅ PostgreSQL database with Prisma ORM
- ✅ Clean, modern UI with Tailwind CSS

## Deployment

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_API_URL` - Your backend API URL
   - `NEXT_PUBLIC_SOCKET_URL` - Your backend Socket.io URL
3. Deploy

### Backend (Render)
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install && npm run build`
4. Set start command: `cd backend && npm start`
5. Set environment variables:
   - `PORT` - Server port (usually 5000)
   - `DATABASE_URL` - PostgreSQL connection string
   - `JWT_SECRET` - Random secret key
   - `FRONTEND_URL` - Your frontend URL
   - `NODE_ENV` - production
6. Deploy

## Notes

- This is a basic implementation. Production apps would need:
  - File storage for downloaded files
  - Rate limiting
  - Input validation and sanitization
  - Error handling improvements
  - File serving/download endpoints
  - Progress tracking integration with Socket.io

