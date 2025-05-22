import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Simple polyfills with required properties for PDF.js
if (typeof global !== 'undefined') {
  if (!global.DOMMatrix) {
    global.DOMMatrix = class {
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      is2D = true; isIdentity = true;
      
      constructor() {}
      translateSelf() { return this; }
      scaleSelf() { return this; }
      rotateSelf() { return this; }
      skewXSelf() { return this; }
      skewYSelf() { return this; }
    };
  }
  
  if (!global.DOMPoint) {
    global.DOMPoint = class {
      x = 0; y = 0; z = 0; w = 1;
      constructor() {
        this.x = 0; this.y = 0; this.z = 0; this.w = 1;
      }
    };
  }
  
  if (!global.URL) {
    global.URL = require('url').URL;
  }
}

import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.js';

if (typeof process !== 'undefined' && process.versions?.node) {
  GlobalWorkerOptions.workerSrc = 'pdfjs-dist/legacy/build/pdf.worker.js';
}

async function extractTextFromPdf(fileBuffer: ArrayBuffer): Promise<string> {
  try {
    const typedArray = new Uint8Array(fileBuffer);
    const loadingTask = getDocument({ data: typedArray });
    const pdfDocument = await loadingTask.promise;
    let fullText = '';
    
    for (let i = 1; i <= pdfDocument.numPages; i++) {
      const page = await pdfDocument.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText = fullText + pageText + '\n';
      page.cleanup();
    }
    
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
    
    let pdfTextContent = '';
    try {
      pdfTextContent = await extractTextFromPdf(fileBuffer);
    } catch (parseError: any) {
      console.error('Error parsing PDF:', parseError);
      return NextResponse.json({ error: 'Failed to parse the PDF file.' }, { status: 500 });
    }
    
    if (!pdfTextContent.trim()) {
      return NextResponse.json({ error: 'Could not extract text from PDF.' }, { status: 400 });
    }

    const maxLength = 100000;
    let trimmedContent = pdfTextContent;
    if (pdfTextContent.length > maxLength) {
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
    
    const msg = await anthropic.messages.create({
      model: 'claude-3-7-sonnet-latest',
      system: systemPrompt,
      max_tokens: 4096,
      messages: [{ role: 'user', content: [{ type: 'text', text: userMessage }] }],
    });
    
    if (msg.content && msg.content.length > 0 && msg.content[0].type === 'text') {
      return NextResponse.json({ summary: msg.content[0].text });
    } else {
      return NextResponse.json({ error: 'Failed to get summary from AI.' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in /api/summarize:', error);
    let errorMessage = 'An unexpected error occurred.';
    
    if (error instanceof Anthropic.APIError) {
      errorMessage = `Anthropic API Error: ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
