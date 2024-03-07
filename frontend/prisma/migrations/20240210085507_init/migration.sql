/*
  Warnings:

  - You are about to drop the column `path` on the `Files` table. All the data in the column will be lost.
  - Added the required column `channelId` to the `Files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Files" DROP COLUMN "path",
ADD COLUMN     "channelId" TEXT NOT NULL;
