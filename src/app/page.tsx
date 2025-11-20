'use client';

import { useState } from 'react';
import VideoPlayer from '@/components/VideoPlayer';

type UploadResult = {
  id: string;
  title: string;
};

export default function Home() {
  const [videoId, setVideoId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploading(true);

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/videos/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setUploadResult(result);
        setVideoId(result.id);
      } else {
        alert('Upload failed: ' + result.error);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">Video Player with Encryption</h1>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Upload Section */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">Upload and Encrypt Video</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Video Title</label>
              <input
                type="text"
                name="title"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter video title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Video File</label>
              <input
                type="file"
                name="video"
                accept="video/*"
                required
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={uploading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-md font-medium transition-colors"
            >
              {uploading ? 'Processing...' : 'Upload & Encrypt'}
            </button>
          </form>

          {uploadResult && (
            <div className="mt-4 p-4 bg-green-800 rounded-md">
              <h3 className="font-semibold">Video Processed Successfully!</h3>
              <p>Title: {uploadResult.title}</p>
              <p>ID: {uploadResult.id}</p>
            </div>
          )}
        </div>

        {/* Player Section */}
        {videoId && (
          <div className="bg-gray-800 p-6 rounded-xl">
            <h2 className="text-xl font-semibold mb-4">Video Player</h2>
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <VideoPlayer videoId={videoId} />
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p className="text-gray-300 mb-4">
            This app demonstrates video playback with AES-128 encryption using HLS streaming.
            Upload a video file to encrypt it and play it back securely.
          </p>
          <h3 className="text-lg font-medium mb-2">Features:</h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            <li>HLS streaming with AES-128 encryption</li>
            <li>Video.js player with custom controls</li>
            <li>Keyboard shortcuts</li>
            <li>Responsive design</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
