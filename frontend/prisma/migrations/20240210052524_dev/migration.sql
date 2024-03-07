/*
  Warnings:

  - The required column `secret` was added to the `User` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "background" TEXT NOT NULL DEFAULT 'https://w.wallhaven.cc/full/28/wallhaven-288vgg.jpg',
ADD COLUMN     "secret" TEXT NOT NULL,
ADD COLUMN     "useBackground" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Files" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Files_pkey" PRIMARY KEY ("id")
);
