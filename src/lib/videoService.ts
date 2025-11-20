import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const execAsync = promisify(exec);

// Detect the appropriate shell based on the platform
const shell = process.platform === 'win32' ? 'bash.exe' : '/bin/bash';

// Convert Windows path to POSIX path for shell compatibility
const toPosixPath = (winPath: string) => {
  if (process.platform !== 'win32') return winPath;
  return winPath.replace(/\\/g, '/');
};

// Simple in-memory storage for videos (for minimal setup)
const videos: { [key: string]: { title: string; filePath: string; keyPath?: string; playlistPath: string } } = {};

export async function addVideo({
  title,
  filePath,
  id
}: {
  title: string;
  filePath: string;
  id: string;
}) {
  const outputDir = path.resolve('videos');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const keyId = id;

  const timestamp = Date.now();
  const playlistPath = path.join(outputDir, `${timestamp}-playlist.m3u8`);
  const keyPath = path.join(outputDir, `${timestamp}-key.bin`);
  const keyInfoPath = path.join(outputDir, `${timestamp}-key-info.txt`);

  // Generate encryption key
  const key = crypto.randomBytes(16);
  fs.writeFileSync(keyPath, key);
  console.log('Key file created:', keyPath, 'size:', fs.statSync(keyPath).size);

  // Create key info file for FFmpeg
  const keyInfoContent = `http://localhost:3000/api/videos/${keyId}/key\n${toPosixPath(keyPath)}\n`;
  fs.writeFileSync(keyInfoPath, keyInfoContent);
  console.log('Key info file created:', keyInfoPath, 'content:', keyInfoContent.replace('\n', '\\n'));

  // FFmpeg command for HLS with encryption
  const posixFilePath = toPosixPath(filePath);
  const posixPlaylistPath = toPosixPath(playlistPath);
  const posixSegmentPattern = toPosixPath(path.join(outputDir, `${timestamp}-segment-%03d.ts`));
  const posixKeyInfoPath = toPosixPath(keyInfoPath);
  const ffmpegCommand = `ffmpeg -y -i "${posixFilePath}" \
    -c:v libx264 -preset veryfast -b:v 800k -maxrate 800k -bufsize 1600k \
    -vf "scale=-2:720" -g 48 -keyint_min 48 -sc_threshold 0 \
    -c:a aac -b:a 128k -ac 2 -ar 44100 \
    -hls_time 10 -hls_list_size 0 -hls_playlist_type vod \
    -hls_segment_filename "${posixSegmentPattern}" \
    -hls_key_info_file "${posixKeyInfoPath}" \
    -f hls "${posixPlaylistPath}"`;

  console.log('FFmpeg command:', ffmpegCommand);
  console.log('Output dir:', outputDir);
  console.log('Playlist path:', playlistPath);
  console.log('Key path:', keyPath);
  console.log('Key info path:', keyInfoPath);

  try {
    await execAsync(ffmpegCommand, { shell });
    console.log('FFmpeg completed successfully');
    console.log('Playlist file exists:', fs.existsSync(playlistPath));
    console.log('Key file exists:', fs.existsSync(keyPath));
  } catch (error) {
    console.error('FFmpeg error:', error);
    throw new Error('Video processing failed. Ensure FFmpeg is installed and available in PATH.');
  }

  // Clean up key info file (not needed after processing)
  if (fs.existsSync(keyInfoPath)) {
    fs.unlinkSync(keyInfoPath);
  }

  // Store in memory
  videos[keyId] = { title, filePath, playlistPath, keyPath };
  console.log('Storing video:', keyId, 'playlistPath:', playlistPath, 'keyPath:', keyPath);

  return { id: keyId, title, playlistPath };
}

export function getVideo(id: string) {
  console.log('Getting video:', id, 'found:', !!videos[id]);
  return videos[id];
}

export async function getVideoFile(videoId: string, fileType: 'playlist' | 'segment' | 'key', segmentName?: string) {
  const video = getVideo(videoId);
  if (!video) return null;

  let filePath: string;
  switch (fileType) {
    case 'playlist':
      filePath = video.playlistPath;
      console.log('Playlist path:', filePath, 'exists:', fs.existsSync(filePath));
      break;
    case 'key':
      if (!video.keyPath) return null;
      filePath = video.keyPath;
      break;
    case 'segment':
      if (!segmentName) return null;
      const playlistDir = path.dirname(video.playlistPath);
      filePath = path.join(playlistDir, segmentName);
      break;
    default:
      return null;
  }

  if (!fs.existsSync(filePath)) return null;
  return fs.createReadStream(filePath);
}

export async function getVideoEncryptionKey(videoId: string): Promise<Buffer | null> {
  const video = getVideo(videoId);
  if (!video || !video.keyPath || !fs.existsSync(video.keyPath)) {
    return null;
  }
  return fs.readFileSync(video.keyPath);
}
