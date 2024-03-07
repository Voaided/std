'use server'
import { PrismaClient } from "@prisma/client"

export default async function SendFile( name, channelId, userId) {
'use server'
    const prisma = new PrismaClient();
    const newFile = await prisma.files.create({
        data: {
            name: name,
            channelId: channelId,
            userId: userId,
        },
    });
    const response = newFile.id
    await prisma.$disconnect();
    
    return response
}

