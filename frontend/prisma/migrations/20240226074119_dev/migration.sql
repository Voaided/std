/*
  Warnings:

  - Added the required column `serverId` to the `Files` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
-- Add the serverId column with a default value
ALTER TABLE "Files" ADD COLUMN "serverId" TEXT NOT NULL DEFAULT '1';

-- Remove the default value constraint
ALTER TABLE "Files" ALTER COLUMN "serverId" DROP DEFAULT;
