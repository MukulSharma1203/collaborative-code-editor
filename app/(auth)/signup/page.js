
import { SignUp } from '@clerk/nextjs'

export default function Signup() {
  return (
    <div className="relative h-screen">

      <div className="absolute inset-0">
        <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_60%,#1e3a8a_100%)]"></div>
      </div>


      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4">
        <div className="max-w-3xl text-center">
          <SignUp routing="hash" signInUrl='/signin' />
        </div>
      </div>
    </div>
  )
}
