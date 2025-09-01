"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Terminal } from 'lucide-react';

// Dynamically import the terminal with no SSR
const WebTerminal = dynamic(() => import('./WebTerminal'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-400 bg-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-sm">Loading terminal...</p>
      </div>
    </div>
  )
});

export default function DynamicWebTerminal(props) {
  const [mounted, setMounted] = useState(false);

  // Ensure we're mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 bg-slate-900">
        <div className="text-center">
          <Terminal className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="text-sm">Initializing terminal...</p>
        </div>
      </div>
    );
  }

  return <WebTerminal {...props} />;
}
