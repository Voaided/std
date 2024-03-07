'use server'
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


export default async function UserEmail() {
'use server'
    const session = await getServerSession(authOptions);
    
return (
    <>
    {session && (
        <div className="">
          <p>Signed in as {session.user && session.user.name }</p>
          <img src={session.user.image } alt={session.user.name} />
          <a href="/api/auth/signout">Sign out by link</a>
        </div>
      )}

      </>
)
}