"use client";

import dynamic from 'next/dynamic';

// Dynamically import the CollaborativeEditor to avoid SSR issues
const CollaborativeEditor = dynamic(
  () => import('./CollaborativeEditor').then(mod => ({ default: mod.CollaborativeEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-950 rounded-lg border border-gray-700">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Loading editor...</p>
        </div>
      </div>
    )
  }
);

export { CollaborativeEditor };
