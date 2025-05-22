import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Polyfills must be at the very top
if (typeof global !== 'undefined') {
  if (typeof (global as any).DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { constructor(init?: any) {} translateSelf(x: number, y: number) { return this; } scaleSelf(x: number, y: number) { return this; } rotateSelf(angle: number) { return this; } skewXSelf(angle: number) { return this; } skewYSelf(angle: number) { return this; } a=1;d=1;e=0;f=0;b=0;c=0;m11=1;m12=0;m13=0;m14=0;m21=0;m22=1;m23=0;m24=0;m31=0;m32=0;m33=1;m34=0;m41=0;m42=0;m43=0;m44=1;is2D=true;isIdentity=true; };
  }
  if (typeof (global as any).DOMPoint === 'undefined') {
    (global as any).DOMPoint = class DOMPoint { x=0;y=0;z=0;w=1; constructor(x?:number,y?:number,z?:number,w?:number){this.x=x||0;this.y=y||0;this.z=z||0;this.w=w||1;} };
  }
  if (typeof (global as any).URL === 'undefined') {
    (global as any).URL = require('url').URL; 
  }
}

// Use named imports for getDocument and GlobalWorkerOptions from the legacy build
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.js';

if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.js';
}

async function extractTextFromPdf(fileBuffer: ArrayBuffer): Promise<string> {
    try {
        const typedArray = new Uint8Array(fileBuffer);
        const loadingTask = getDocument({ data: typedArray });
        const pdfDocument = await loadingTask.promise;
        let fullText = '';
        
        // Get total memory before processing
        const memBefore = process.memoryUsage();
        
        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page = await pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText = fullText + pageText + String.fromCharCode(10);
            
            // Important: Release page resources after extraction
            page.cleanup();
            
            // Force garbage collection every few pages for very large documents
            if (i % 10 === 0 && global.gc) {
                try {
                    global.gc();
                } catch (e) {
                    // Ignore if gc is not available
                }
            }
        }
        
        // Get memory after processing to detect leaks
        const memAfter = process.memoryUsage();
        console.log(`Memory usage before: ${Math.round(memBefore.heapUsed / 1024 / 1024)}MB, after: ${Math.round(memAfter.heapUsed / 1024 / 1024)}MB`);
        
        return fullText;
    } catch (error) {
        console.error("PDF extraction error:", error);
        throw error;
    }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const pdfFile = formData.get('pdfFile') as File | null;
    if (!pdfFile) return NextResponse.json({ error: 'No PDF file uploaded.' }, { status: 400 });
    if (pdfFile.type !== 'application/pdf') return NextResponse.json({ error: 'Uploaded file is not a PDF.' }, { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('ANTHROPIC_API_KEY not found');
      return NextResponse.json({ error: 'Server config error.' }, { status: 500 });
    }
    const anthropic = new Anthropic({ apiKey });
    const fileBuffer = await pdfFile.arrayBuffer();
    
    console.log(`Processing PDF: ${pdfFile.name}, Size: ${Math.round(fileBuffer.byteLength / 1024)}KB`);
    
    let pdfTextContent = '';
    try {
      pdfTextContent = await extractTextFromPdf(fileBuffer);
      console.log(`Extracted ${pdfTextContent.length} characters from PDF`);
    } catch (parseError: any) {
      console.error('Error parsing PDF with pdfjs-dist:', parseError);
      let specificError = 'Failed to parse the PDF file.';
      if (parseError && parseError.message) {
        if (parseError.message.includes('DOMMatrix') || parseError.message.includes('DOMPoint')) {
            specificError = 'PDF parsing failed due to missing browser APIs. Polyfill might be incomplete.';
        } else if (parseError.message.includes('Setting up fake worker failed') || 
                   parseError.message.includes('Worker src') || 
                   parseError.message.includes("Cannot read properties of undefined (reading 'GlobalWorkerOptions')")) {
            specificError = 'PDF worker script failed to load or pdfjs-dist import failed. Check server logs for path issues.';
        }
      }
      return NextResponse.json({ error: specificError }, { status: 500 });
    }
    if (!pdfTextContent.trim()) return NextResponse.json({ error: 'Could not extract text from PDF.' }, { status: 400 });

    // Trim large documents to prevent Claude API issues
    const maxLength = 100000; // ~100K chars
    let trimmedContent = pdfTextContent;
    if (pdfTextContent.length > maxLength) {
      console.log(`PDF content exceeds ${maxLength} chars (${pdfTextContent.length}). Trimming.`);
      trimmedContent = pdfTextContent.substring(0, maxLength);
    }

    const systemPrompt = `In the upcoming messages I will provide you with individual full length contracts. I want you to format every subsequent contract I give you in the same way as the examples in this summary document, extracting all relevant information. make sure you title the sections exactly as in my example, and all of the summaries have the same sections flowing in the same way. Ensure you keep the sections bolded and you format it properly in markdown so that when I copy paste it, it retains format. Include all relevant information on terms, pricing, locations, routes (if applicable) etc. When you summarize the appendices / attachments, make sure to note for each one whether they are (redacted) or (not included in the contract). The contract text will follow.`;
    
    const userMessage = `Please summarize the following contract text according to the detailed instructions I provided in the system prompt:

--- BEGIN CONTRACT TEXT ---
${trimmedContent}
--- END CONTRACT TEXT ---`;

    console.log('Sending to Claude API...');
    
    const msg = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-latest',
      system: systemPrompt,
      max_tokens: 4096,
      messages: [{ role: 'user', content: [{ type: 'text', text: userMessage }] }],
    });
    
    console.log('Claude API response received.');
    
    if (msg.content && msg.content.length > 0 && msg.content[0].type === 'text') {
      return NextResponse.json({ summary: msg.content[0].text });
    } else {
      console.error('Anthropic API bad response:', msg);
      return NextResponse.json({ error: 'Failed to get summary from AI.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in /api/summarize:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Anthropic.APIError) errorMessage = `Anthropic API Error: ${error.message}`;
    else if (error.message) errorMessage = error.message;
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}