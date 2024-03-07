/*
  Warnings:

  - You are about to drop the column `userId` on the `Channel` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Servers` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Channel" DROP CONSTRAINT "Channel_userId_fkey";

-- DropForeignKey
ALTER TABLE "Servers" DROP CONSTRAINT "Servers_userId_fkey";

-- AlterTable
ALTER TABLE "Channel" DROP COLUMN "userId";

-- AlterTable
ALTER TABLE "Servers" DROP COLUMN "userId";

-- CreateTable
CREATE TABLE "ServerUser" (
    "serverId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ServerUser_pkey" PRIMARY KEY ("serverId","userId")
);

-- CreateTable
CREATE TABLE "ChannelUser" (
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ChannelUser_pkey" PRIMARY KEY ("channelId","userId")
);

-- AddForeignKey
ALTER TABLE "ServerUser" ADD CONSTRAINT "ServerUser_serverId_fkey" FOREIGN KEY ("serverId") REFERENCES "Servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServerUser" ADD CONSTRAINT "ServerUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelUser" ADD CONSTRAINT "ChannelUser_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "Channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelUser" ADD CONSTRAINT "ChannelUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
