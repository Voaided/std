'use server'
  
import SignInForm from "@/components/SignInForm"
import UserEmail from "@/components/UserEmail"
export default async function SignIn() {
  'use server'
  
  
  return (  
  <>
    <div className='flex flex-col h-screen w-screen justify-center items-center text-white'>
    <UserEmail />
      <div id="cards" className="flex flex-col flex-warp gap-2 justify-center items-center">
        <div className="card rounded-xl relative flex-col flex justify-center items-center">
          <div className="card-content justify-center items-center">
            <h1 className="text-white text-1xl justify-center items-center signin-logo">Sign in / Sign up</h1>
            <div className="provider-container">
              <SignInForm />              
            </div>
          </div>    
        </div>
      </div>  
    </div>
  </>
  )
}

