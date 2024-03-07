/*
  Warnings:

  - You are about to drop the `Channel` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ChannelUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ServerUser` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Servers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Channel" DROP CONSTRAINT "Channel_serverId_fkey";

-- DropForeignKey
ALTER TABLE "ChannelUser" DROP CONSTRAINT "ChannelUser_channelId_fkey";

-- DropForeignKey
ALTER TABLE "ChannelUser" DROP CONSTRAINT "ChannelUser_userId_fkey";

-- DropForeignKey
ALTER TABLE "ServerUser" DROP CONSTRAINT "ServerUser_serverId_fkey";

-- DropForeignKey
ALTER TABLE "ServerUser" DROP CONSTRAINT "ServerUser_userId_fkey";

-- DropTable
DROP TABLE "Channel";

-- DropTable
DROP TABLE "ChannelUser";

-- DropTable
DROP TABLE "ServerUser";

-- DropTable
DROP TABLE "Servers";

-- CreateTable
CREATE TABLE "servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "serveruser" (
    "serverid" TEXT NOT NULL,
    "userid" TEXT NOT NULL,

    CONSTRAINT "serveruser_pkey" PRIMARY KEY ("serverid","userid")
);

-- CreateTable
CREATE TABLE "channel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serverid" TEXT NOT NULL,

    CONSTRAINT "channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channeluser" (
    "channelid" TEXT NOT NULL,
    "userid" TEXT NOT NULL,

    CONSTRAINT "channeluser_pkey" PRIMARY KEY ("channelid","userid")
);

-- AddForeignKey
ALTER TABLE "serveruser" ADD CONSTRAINT "serveruser_serverid_fkey" FOREIGN KEY ("serverid") REFERENCES "servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serveruser" ADD CONSTRAINT "serveruser_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel" ADD CONSTRAINT "channel_serverid_fkey" FOREIGN KEY ("serverid") REFERENCES "servers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channeluser" ADD CONSTRAINT "channeluser_channelid_fkey" FOREIGN KEY ("channelid") REFERENCES "channel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channeluser" ADD CONSTRAINT "channeluser_userid_fkey" FOREIGN KEY ("userid") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
