import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Polyfills must be at the very top
if (typeof global !== 'undefined') {
  if (typeof (global as any).DOMMatrix === 'undefined') {
    (global as any).DOMMatrix = class DOMMatrix { 
      constructor(init?: any) {} 
      translateSelf(x: number, y: number) { return this; } 
      scaleSelf(x: number, y: number) { return this; } 
      rotateSelf(angle: number) { return this; } 
      skewXSelf(angle: number) { return this; } 
      skewYSelf(angle: number) { return this; } 
      a=1;d=1;e=0;f=0;b=0;c=0;m11=1;m12=0;m13=0;m14=0;m21=0;m22=1;m23=0;m24=0;m31=0;m32=0;m33=1;m34=0;m41=0;m42=0;m43=0;m44=1;is2D=true;isIdentity=true; 
    };
  }
  if (typeof (global as any).DOMPoint === 'undefined') {
    (global as any).DOMPoint = class DOMPoint { 
      x=0;y=0;z=0;w=1; 
      constructor(x?:number,y?:number,z?:number,w?:number){this.x=x||0;this.y=y||0;this.z=z||0;this.w=w||1;} 
    };
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
    const typedArray = new Uint8Array(fileBuffer);
    const loadingTask = getDocument({ data: typedArray });
    const pdfDocument = await loadingTask.promise;
    let fullText = '';
    for (let i = 1; i <= pdfDocument.numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText = fullText + pageText + String.fromCharCode(10);
    }
    return fullText;
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
    let pdfTextContent = '';
    try {
      pdfTextContent = await extractTextFromPdf(fileBuffer);
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
    const modelName = 'claude-3-7-sonnet-latest';
    const userMessage = `Please summarize the following contract text according to the detailed instructions I provided in the system prompt:

--- BEGIN CONTRACT TEXT ---
${pdfTextContent}
--- END CONTRACT TEXT ---`;
    const msg = await anthropic.messages.create({
      model: modelName,
      system: systemPrompt,
      max_tokens: 4096,
      messages: [{ role: 'user', content: [{ type: 'text', text: userMessage }] }],
    });
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
