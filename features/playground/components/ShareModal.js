"use client";

import { useState } from 'react';
import { X, Copy, Check, Users, Eye, Edit } from 'lucide-react';

export function ShareModal({ isOpen, onClose, projectId, projectName }) {
  const [copied, setCopied] = useState(false);
  const [permission, setPermission] = useState('edit');
  
  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/playground/${projectId}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-gray-700 rounded-xl p-6 w-full max-w-md shadow-2xl transform transition-all">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-200 via-purple-300 to-teal-200 bg-clip-text text-transparent mb-1">
              Share Project
            </h2>
            <p className="text-sm text-gray-300 font-medium">{projectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-800 rounded-xl transition-all duration-200 text-gray-400 hover:text-gray-200 hover:scale-110"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Share Link */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-200 mb-3">
            Share Link
          </label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-slate-800 border border-gray-600 rounded-lg p-3 text-sm text-gray-200 font-mono overflow-hidden">
              <div className="truncate">{shareUrl}</div>
            </div>
            <button
              onClick={handleCopyLink}
              className="p-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-all duration-200"
              title="Copy link"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
          {copied && (
            <div className="flex items-center space-x-2 mt-2">
              <Check className="h-3 w-3 text-green-400" />
              <p className="text-green-400 text-xs font-medium">Copied!</p>
            </div>
          )}
        </div>

        {/* Permission Settings */}
        <div className="mb-5">
          <label className="block text-sm font-semibold text-gray-200 mb-3">
            Access Level
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-3 p-3 bg-slate-800 border border-gray-600 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
              <input
                type="radio"
                name="permission"
                value="edit"
                checked={permission === 'edit'}
                onChange={(e) => setPermission(e.target.value)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
              />
              <Edit className="h-4 w-4 text-purple-400" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-200">Can edit</div>
                <div className="text-xs text-gray-400">Full access to edit files and collaborate</div>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 p-3 bg-slate-800 border border-gray-600 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
              <input
                type="radio"
                name="permission"
                value="view"
                checked={permission === 'view'}
                onChange={(e) => setPermission(e.target.value)}
                className="w-4 h-4 text-purple-600 focus:ring-purple-500"
              />
              <Eye className="h-4 w-4 text-gray-400" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-200">Can view</div>
                <div className="text-xs text-gray-400">Read-only access to view files</div>
              </div>
            </label>
          </div>
        </div>

        {/* Authentication & Collaboration Info */}
        <div className="space-y-3 mb-5">
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-semibold text-purple-200">Real-time Collaboration</span>
            </div>
            <p className="text-xs text-gray-300">
              Edit simultaneously and see cursors in real-time.
            </p>
          </div>
          
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11.584-7.016M9 10.584l.686-.686a2 2 0 112.828 2.828l-.686.686M13 7.757V6a2 2 0 00-2-2H8a2 2 0 00-2 2v1.757l.172.172a2 2 0 002.828 0L13 7.757z" />
              </svg>
              <span className="text-sm font-semibold text-blue-200">Authentication Required</span>
            </div>
            <p className="text-xs text-gray-300">
              Users must sign in to access this project.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-gray-400 hover:text-gray-200 hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCopyLink}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white rounded-lg transition-colors font-medium"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
