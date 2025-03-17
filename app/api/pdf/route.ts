import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import PDFParser from 'pdf2json';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileName = uuidv4();
    const tempFilePath = `/tmp/${fileName}.pdf`;

    // Convert file to buffer and save temporarily
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempFilePath, fileBuffer);

    // Parse the PDF using pdf2json
    const parsedText = await new Promise<string>((resolve, reject) => {
      // Using any type to bypass type constraints for constructor arguments
      const pdfParser = new (PDFParser as any)(null, 1);
      
      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF parsing error:', errData.parserError);
        reject(new Error(errData.parserError));
      });

      pdfParser.on('pdfParser_dataReady', () => {
        const rawText = (pdfParser as any).getRawTextContent();
        resolve(rawText);
      });

      pdfParser.loadPDF(tempFilePath);
    });

    // Clean up temp file
    await fs.unlink(tempFilePath).catch(err => console.warn('Failed to delete temp file:', err));

    return NextResponse.json({
      text: parsedText,
      info: {
        fileName: file.name,
        fileType: file.type
      }
    });
  } catch (error: any) {
    console.error("PDF processing error:", error);
    return NextResponse.json(
      { error: "Failed to process PDF file", details: error.message },
      { status: 500 }
    );
  }
}
