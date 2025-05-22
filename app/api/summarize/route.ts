import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { initializePolyfills } from '../utils/polyfills';

// Initialize polyfills
initializePolyfills();

// Import PDF.js after polyfills
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.js';

if (typeof process !== 'undefined' && process.versions?.node) {
  GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.js';
}

interface PDFTextItem {
  str: string;
  dir?: string;
  width?: number;
  height?: number;
  transform?: number[];
}

interface PDFTextContent {
  items: PDFTextItem[];
}

interface PDFPageProxy {
  getTextContent(): Promise<PDFTextContent>;
  cleanup(): void;
}

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

async function extractTextFromPdf(fileBuffer: ArrayBuffer): Promise<string> {
  try {
    const typedArray = new Uint8Array(fileBuffer);
    const loadingTask = getDocument({ data: typedArray });
    const pdfDocument: PDFDocumentProxy = await loadingTask.promise;
    let fullText = '';
    
    const memBefore = process.memoryUsage();
    
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: PDFTextItem) => item.str)
        .join(' ');
      fullText = fullText + pageText + '\n';
      
      // Release page resources
      page.cleanup();
      
      // Force garbage collection every 10 pages for large documents
      if (i % 10 === 0 && global.gc) {
        try {
          global.gc();
        } catch (error) {
          // Ignore if gc is not available
        }
      }
    }
    
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
    
    if (!pdfFile) {
      return NextResponse.json({ error: 'No PDF file uploaded.' }, { status: 400 });
    }
    
    if (pdfFile.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Uploaded file is not a PDF.' }, { status: 400 });
    }

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
    } catch (parseError: unknown) {
      console.error('Error parsing PDF with pdfjs-dist:', parseError);
      let specificError = 'Failed to parse the PDF file.';
      
      if (parseError instanceof Error) {
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
    
    if (!pdfTextContent.trim()) {
      return NextResponse.json({ error: 'Could not extract text from PDF.' }, { status: 400 });
    }

    // Trim large documents to prevent Claude API issues
    const maxLength = 100000; // ~100K chars
    let trimmedContent = pdfTextContent;
    if (pdfTextContent.length > maxLength) {
      console.log(`PDF content exceeds ${maxLength} chars (${pdfTextContent.length}). Trimming.`);
      trimmedContent = pdfTextContent.substring(0, maxLength);
    }

    const systemPrompt = `You are an expert legal contract analyst. Analyze the provided contract and create a comprehensive, professional summary using the following standardized format. Use proper markdown formatting with bold headings and clear structure.

## **Contract Overview**
- Contract type and primary purpose
- Contracting parties (names and roles)
- Effective date and contract duration
- Brief description of the agreement

## **Key Terms & Conditions**
- Primary obligations of each party
- Performance requirements and deliverables
- Important deadlines and milestones
- Compliance and regulatory requirements

## **Financial Details**
- Total contract value and pricing structure
- Payment terms and schedule
- Additional fees, penalties, or incentives
- Currency and payment methods

## **Risk Assessment**
- Liability limitations and indemnification clauses
- Insurance requirements
- Force majeure and dispute resolution
- Termination conditions and penalties

## **Important Clauses**
- Confidentiality and non-disclosure provisions
- Intellectual property rights
- Assignment and subcontracting terms
- Governing law and jurisdiction

## **Locations & Logistics**
- Service locations, routes, or geographic scope
- Delivery terms and logistics arrangements
- Site-specific requirements or restrictions

## **Appendices & Attachments**
- List each appendix/attachment with brief description
- Note if content is (redacted) or (not included in contract)
- Highlight any critical supplementary documents

## **Key Recommendations**
- Critical points requiring attention
- Potential negotiation opportunities
- Risk mitigation suggestions

Ensure all sections are clearly formatted with bold headings, bullet points for readability, and proper markdown syntax. Be thorough but concise, focusing on actionable insights and critical information.`;
    
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
  } catch (error: unknown) {
    console.error('Error in /api/summarize:', error);
    let errorMessage = 'An unexpected error occurred.';
    
    if (error instanceof Anthropic.APIError) {
      errorMessage = `Anthropic API Error: ${error.message}`;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}