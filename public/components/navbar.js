'use client';
import Image from "next/image";
import Link from "next/link";
import codeImage from "@/public/code.png";
import { useAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';

export default function Navbar() {

  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const signOut = useClerk();

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      router.push('/signin');
    }
  };

  const confirmSignOut = async () => {
    await signOut.signOut();
    router.push('/');
    window.location.reload();
  };

  const cancelSignOut = () => {
    router.push('/');
  };


  return (
    <nav className="relative bg-blue-950/30 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-white/10">
      <div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
        <div className="relative flex h-16 items-center justify-between">
          <div className="flex flex-1 items-center justify-start">
            <Link href="/" className="flex gap-2 items-center">
              <Image
                src={codeImage}
                alt="Code"
                width={50}
                height={50}
                style={{
                  filter: 'brightness(0) saturate(100%) invert(32%) sepia(77%) saturate(2476%) hue-rotate(215deg) brightness(102%) contrast(97%)'
                }}
              />
              <h2 className="text-white text-2xl">
                Collaborative Code Studio
              </h2>
            </Link>
          </div>
          <div className="flex items-center mt-1 justify-end">
            <button onClick={handleGetStarted} type="button" className="text-white bg-gradient-to-br from-purple-800 to-blue-800 hover:bg-gradient-to-bl font-bold rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 transition-colors duration-300 ease-in-out flex items-center gap-2">
              {!isLoaded ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Loading...
                </>
              ) : (
                isSignedIn ? 'Dashboard' : 'Get Started'
              )}
            </button>


            {isSignedIn && (
              <div>
                <button command="show-modal" commandfor="dialog" >
                  <span className="material-symbols-outlined border-2 border-red-700 h-10 w-10 rounded-2xl mb-2 pt-1.5 hover:bg-red-800 transition-colors duration-300 ease-in-out">
                    exit_to_app
                  </span>
                </button>
                <el-dialog>
                  <dialog id="dialog" aria-labelledby="dialog-title" className="fixed inset-0 size-auto max-h-none max-w-none overflow-y-auto bg-transparent backdrop:bg-transparent">
                    <el-dialog-backdrop className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"></el-dialog-backdrop>

                    <div tabIndex="0" className="flex min-h-full items-end justify-center p-4 text-center focus:outline-none sm:items-center sm:p-0">
                      <el-dialog-panel className="relative transform overflow-hidden rounded-lg bg-gray-800 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95">
                        <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                          <div className="sm:flex sm:items-start">
                            <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-red-500/10 sm:mx-0 sm:size-10">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" data-slot="icon" aria-hidden="true" className="size-6 text-red-400">
                                <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                              <h3 id="dialog-title" className="text-base font-bold text-white">SIGN OUT</h3>
                              <div className="mt-2">
                                <p className="text-sm text-gray-400">Are you sure you want to Sign Out?</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                          <button onClick={confirmSignOut} type="button" command="close" commandfor="dialog" className="inline-flex w-full justify-center rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white hover:bg-red-400 sm:ml-3 sm:w-auto">Sign Out</button>
                          <button onClick={cancelSignOut} type="button" command="close" commandfor="dialog" className="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-white/20 sm:mt-0 sm:w-auto">Cancel</button>
                        </div>
                      </el-dialog-panel>
                    </div>
                  </dialog>
                </el-dialog>
              </div>
            )}


          </div>
        </div>
      </div>
    </nav>
  );
}
