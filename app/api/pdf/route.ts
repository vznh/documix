import * as pdfjs from "pdfjs-dist/build/pdf.min.mjs";
import("pdfjs-dist/build/pdf.worker.min.mjs");

export async function POST(req, res) {
  const pdf = await pdfjs.getDocument(
    "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
  ).promise;
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  return NextResponse.json({ message: textContent }, { status: 200 });
}
