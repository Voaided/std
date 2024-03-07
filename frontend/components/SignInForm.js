'use client'
import { signIn } from 'next-auth/react'

export default function SignInForm() {
'use client'
  return (  
    <button onClick={() => signIn('google')} className='bg-blue-500 hover:bg-blue-700 transition-all duration-500 text-white py-2 px-4 roundedtext-white font-bold rounded' >Google</button>
  )
}