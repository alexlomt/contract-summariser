// app/api/utils/streaming-utils.ts
import { ReadableStream } from 'stream/web';

export function createProgressStream() {
  let controller: ReadableStreamController<string> | null = null;
  
  const stream = new ReadableStream({
    start(c) {
      controller = c;
    }
  });

  const sendProgress = (message: string) => {
    controller?.enqueue(JSON.stringify({ progress: message }) + '\n');
  };

  const close = () => {
    controller?.close();
  };

  return { stream, sendProgress, close };
}