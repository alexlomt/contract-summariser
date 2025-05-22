import { NextRequest, NextResponse } from 'next/server';
import HTMLtoDOCX from 'html-to-docx';

export async function POST(req: NextRequest) {
  try {
    // Parse the request body
    const { html } = await req.json();
    
    if (!html) {
      return NextResponse.json(
        { error: 'HTML content is required' },
        { status: 400 }
      );
    }

    console.log('Converting HTML to DOCX...');
    
    // Convert HTML to DOCX on the server side
    const fileBuffer = await HTMLtoDOCX(html, null, {
      table: { row: { cantSplit: true } },
      footer: false,
      header: false,
    });
    
    console.log('DOCX conversion complete.');
    
    // Return the DOCX file as a downloadable response
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="contract-summary.docx"',
      },
    });
  } catch (error) {
    console.error('Error converting HTML to DOCX:', error);
    return NextResponse.json(
      { error: 'Failed to convert HTML to DOCX' },
      { status: 500 }
    );
  }
}