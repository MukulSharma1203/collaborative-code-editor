'use client';

import Image from 'next/image';
import Link from "next/link";
import codeImage from "@/public/code.png";
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';


export default function DashBoard() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleGetStarted = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      router.push('/signin');
    }
  };

  return (
    <div className="relative min-h-screen w-full [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-24">
        <div className="max-w-3xl text-center">
          {/* main */}
          <div className="heading flex flex-col items-center justify-center mb-4 mt-1">
            <h1 className="text-5xl font-bold text-gray-200 mb-2">
              Build. Share. Code <span className="text-blue-600">Together.</span>
            </h1>
            <h2 className="text-lg text-gray-400 mt-6">
              A powerful, desktop-first, all-dark web IDE that brings the speed and flexibility of VS Code to the browser—optimized for real-time, multiplayer coding.
            </h2>

            <button onClick={handleGetStarted} type="button" className="h-15 w-40 text-white bg-gradient-to-r mt-10 from-blue-800 to-purple-800 hover:bg-gradient-to-br shadow-lg shadow-purple-500/50 dark:shadow-lg dark:shadow-purple-800/50 font-bold rounded-xl text-lg px-5 py-2.5 text-center me-2 mb-2">Get Started</button>

          </div>

          <div className="features flex flex-wrap items-center justify-center mt-32 gap-15">
            <div className=" m-2 w-20 h-20 basis-1/4">
              <lord-icon
                src="https://cdn.lordicon.com/lrubprlz.json"
                trigger="loop-on-hover"
                colors="primary:#a39cf4"
                style={{ width: "5rem", height: "5rem" }}>
              </lord-icon>
              <b><p className="text-center text-gray-400">VS Code Experience</p></b>
            </div>

            <div className=" m-2 rounded-full w-20 h-20 basis-1/4">
              <lord-icon
                src="https://cdn.lordicon.com/ailnzwyn.json"
                trigger="loop-on-hover"
                colors="primary:#a39cf4"
                style={{ width: "5rem", height: "5rem" }}>
              </lord-icon>
              <b><p className="text-center text-gray-400">Integrated Terminal</p></b>
            </div>

            <div className=" m-2 w-20 h-20 basis-1/4">
              <lord-icon
                src="https://cdn.lordicon.com/cniwvohj.json"
                trigger="loop-on-hover"
                colors="primary:#a39cf4"
                style={{ width: "5rem", height: "5rem" }}>
              </lord-icon>
              <b><p className="text-center text-gray-400">Real-Time Multiplayer</p></b>
            </div>

            <div className=" m-2 w-20 h-20 basis-1/4">
              <lord-icon
                src="https://cdn.lordicon.com/rrfthkgx.json"
                trigger="loop-on-hover"
                colors="primary:#a39cf4"
                style={{ width: "5rem", height: "5rem" }}>
              </lord-icon>
              <b><p className="text-center text-gray-400">Project Dashboard</p></b>
            </div>

            <div className=" m-2 w-20 h-20 basis-1/4">
              <lord-icon
                src="https://cdn.lordicon.com/bpptgtfr.json"
                trigger="loop-on-hover"
                colors="primary:#a39cf4"
                style={{ width: "5rem", height: "5rem" }}>
              </lord-icon>
              <b><p className="text-center text-gray-400">Live Team Chat</p></b>
            </div>

            <div className=" m-2 w-20 h-20 basis-1/4">
              <lord-icon
                src="https://cdn.lordicon.com/apgkpdeb.json"
                trigger="loop-on-hover"
                colors="primary:#a39cf4"
                style={{ width: "5rem", height: "5rem" }}>
              </lord-icon>
              <b><p className="text-center text-gray-400">Blazing Fast</p></b>
            </div>
          </div>

          {/* main */}
        </div>
      </div>
      <footer className="bg-white shadow-sm dark:bg-gray-900">
        <div className="w-full max-w-screen-xl mx-auto p-4 md:py-8">
          <div className="sm:flex sm:items-center sm:justify-between">
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
            <ul className="flex flex-wrap items-center mb-6 text-sm font-medium text-gray-500 sm:mb-0 dark:text-gray-400">
              <li>
                <a href="#" className="hover:underline me-4 md:me-6">About</a>
              </li>
              <li>
                <a href="#" className="hover:underline me-4 md:me-6">Privacy Policy</a>
              </li>
              <li>
                <a href="#" className="hover:underline me-4 md:me-6">Licensing</a>
              </li>
              <li>
                <a href="#" className="hover:underline">Contact</a>
              </li>
            </ul>
          </div>
          <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
          <span className="block text-sm text-gray-500 sm:text-center dark:text-gray-400">© 2025 <a href="/" className="hover:underline">Collaborative Code Studio</a>. All Rights Reserved.</span>
        </div>
      </footer>

    </div>

  )
}
