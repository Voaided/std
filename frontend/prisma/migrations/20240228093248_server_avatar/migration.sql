/*
  Warnings:

  - Added the required column `avatar` to the `servers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerid` to the `servers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "servers" ADD COLUMN     "avatar" TEXT NOT NULL,
ADD COLUMN     "ownerid" TEXT NOT NULL;
