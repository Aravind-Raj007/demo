import { toCanvas } from 'html-to-image';
import * as Mp4Muxer from 'mp4-muxer';



export async function renderAndExport({ 
  width, 
  height, 
  duration, 
  fps = 30,
  seekTo, 
  onProgress,
  canvasId = 'canvas-container'
}) {
  if (!('VideoEncoder' in window)) {
    alert("WebCodecs API is not supported.");
    return;
  }

  const totalFrames = Math.ceil(duration * fps);
  const frameDurationMicroseconds = 1000000 / fps;
  
  const muxer = new Mp4Muxer.Muxer({
    target: new Mp4Muxer.ArrayBufferTarget(),
    video: {
      codec: 'avc',
      width: width,
      height: height
    },
    fastStart: 'in-memory'
  });

  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => console.error(e)
  });

  videoEncoder.configure({
    codec: 'avc1.4d002a',
    width: width,
    height: height,
    bitrate: 8_000_000,
    framerate: fps
  });

  const canvasContainer = document.getElementById(canvasId);
  if (!canvasContainer) throw new Error("Canvas container not found");

  // Frame Loop
  for (let i = 0; i < totalFrames; i++) {
    const time = i / fps;
    
    // 1. Seek to time
    seekTo(time);
    
    // 2. Wait for render
    // Increased wait time to ensure DOM is fully updated and fonts are ready
    await new Promise(r => setTimeout(r, 150)); 
    
    // 3. Capture Frame using html-to-image
    // toCanvas returns a Promise<HTMLCanvasElement>
    // It uses SVG foreignObject which is generally more accurate than html2canvas
    
    try {
      const canvas = await toCanvas(canvasContainer, {
        width: width,
        height: height,
        backgroundColor: null,
        cacheBust: true, // Force reload images
        skipAutoScale: true,
        style: {
          // Ensure no transforms interfere, though we are capturing a clean container now
          transform: 'none', 
          margin: 0,
          padding: 0
        }
      });

      // 4. Create VideoFrame
      const frame = new VideoFrame(canvas, {
        timestamp: i * frameDurationMicroseconds,
        duration: frameDurationMicroseconds
      });

      // 5. Encode
      videoEncoder.encode(frame, { keyFrame: i % 30 === 0 });
      frame.close();
    } catch (err) {
      console.error("Frame capture failed:", err);
      // Skip frame or handle error?
    }

    // Progress
    if (onProgress) onProgress((i + 1) / totalFrames);
  }

  // Finish
  await videoEncoder.flush();
  muxer.finalize();

  const { buffer } = muxer.target;
  const blob = new Blob([buffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `ad-export-${Date.now()}.mp4`;
  a.click();
  URL.revokeObjectURL(url);
}
