-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Torrent" (
    "id" TEXT NOT NULL,
    "magnetLink" TEXT NOT NULL,
    "infoHash" TEXT,
    "name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'downloading',
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "size" INTEGER,
    "downloaded" INTEGER NOT NULL DEFAULT 0,
    "uploadSpeed" DOUBLE PRECISION,
    "downloadSpeed" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Torrent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Torrent_userId_idx" ON "Torrent"("userId");

-- CreateIndex
CREATE INDEX "Torrent_status_idx" ON "Torrent"("status");

-- AddForeignKey
ALTER TABLE "Torrent" ADD CONSTRAINT "Torrent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
