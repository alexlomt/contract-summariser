// app/api/utils/streaming-utils.ts
import { ReadableStream } from 'stream/web';

export function createProgressStream() {
  let controller: ReadableStreamController<Uint8Array> | null = null;
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(c) {
      controller = c as ReadableStreamController<Uint8Array>; // Cast controller
    }
  });

  const sendProgress = (message: string) => {
    controller?.enqueue(encoder.encode(JSON.stringify({ progress: message }) + '\n'));
  };

  const close = () => {
    controller?.close();
  };

  return { stream, sendProgress, close };
}