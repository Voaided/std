
'use client'

import { redirect } from 'next/navigation'
import Chatroom from "@/components/ChatRoom"
import SideMenu from "@/components/SideMenu"
import Channels from '@/components/SideMenu/Channels'
import {useSession} from "next-auth/react";

export default function Page({ params }) {
    const {data: session, status} = useSession();
    if (status === "authenticated") { 
    console.log(session)

    //check if params.ids is exist
    if (!params.ids) {
        redirect(`/home/@`) 
    }

    const serverid = params.ids[0];
    const channelid = params.ids[1];    

    if (session.user.name) {
    return (
        <>
        <div>
            <div className="h-screen w-screen top-0 left-0 absolute -z-10">
                <img src={session.user.background} className="h-screen w-screen"></img>
            </div>

            <div className="m-custom app flex justify-start items-center left-0 top-0">
                <SideMenu session={session} />
                {channelid && <Channels session={session} serverid={serverid} channelId={channelid} />}
                {channelid && <Chatroom session={session} serverid={serverid} channelId={channelid} />}
            </div>
        </div>
        </>
    )
    }
    }
}

