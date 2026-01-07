/*
  Warnings:

  - You are about to drop the column `downloadSpeed` on the `Torrent` table. All the data in the column will be lost.
  - You are about to drop the column `downloaded` on the `Torrent` table. All the data in the column will be lost.
  - You are about to drop the column `infoHash` on the `Torrent` table. All the data in the column will be lost.
  - You are about to drop the column `magnetLink` on the `Torrent` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Torrent` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `Torrent` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Torrent` table. All the data in the column will be lost.
  - You are about to drop the column `uploadSpeed` on the `Torrent` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `User` table. All the data in the column will be lost.
  - Added the required column `magnet` to the `Torrent` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Torrent" DROP CONSTRAINT "Torrent_userId_fkey";

-- DropIndex
DROP INDEX "Torrent_status_idx";

-- DropIndex
DROP INDEX "Torrent_userId_idx";

-- AlterTable
ALTER TABLE "Torrent" DROP COLUMN "downloadSpeed",
DROP COLUMN "downloaded",
DROP COLUMN "infoHash",
DROP COLUMN "magnetLink",
DROP COLUMN "name",
DROP COLUMN "size",
DROP COLUMN "updatedAt",
DROP COLUMN "uploadSpeed",
ADD COLUMN     "magnet" TEXT NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "name",
DROP COLUMN "updatedAt";

-- CreateTable
CREATE TABLE "File" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "torrentId" TEXT NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Torrent" ADD CONSTRAINT "Torrent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_torrentId_fkey" FOREIGN KEY ("torrentId") REFERENCES "Torrent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
