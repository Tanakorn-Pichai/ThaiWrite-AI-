import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  // Use unpkg CDN matching installed version, or inline worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.0.379'}/build/pdf.worker.min.mjs`;
}

/**
 * Filter out raw PDF internal syntax/tokens that might leak from binary streams
 */
function cleanPDFText(text: string): string {
  // Remove PDF internal markers
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => {
      if (!line) return false;
      // Filter out PDF internal syntax
      if (/^%PDF-/i.test(line)) return false;
      if (/^\d+\s+\d+\s+obj/i.test(line)) return false;
      if (/^endobj/i.test(line)) return false;
      if (/^xref/i.test(line)) return false;
      if (/^trailer/i.test(line)) return false;
      if (/^startxref/i.test(line)) return false;
      if (/^stream/i.test(line)) return false;
      if (/^endstream/i.test(line)) return false;
      if (/^\/(Type|Pages|Catalog|Font|Encoding|Length|Filter)/i.test(line)) return false;
      return true;
    });

  return lines.join('\n\n').trim();
}

/**
 * Extracts real text from PDF using PDF.js
 */
async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        // Combine text items with smart spacing
        const lineParts: string[] = [];
        for (const item of textContent.items) {
          if ('str' in item && typeof item.str === 'string') {
            const str = item.str.trim();
            if (str) {
              lineParts.push(str);
            }
          }
        }

        const pageString = lineParts.join(' ').trim();
        if (pageString.length > 0) {
          pageTexts.push(pageString);
        }
      } catch (pageErr) {
        console.warn(`Error extracting PDF page ${pageNum}:`, pageErr);
      }
    }

    const combinedText = pageTexts.join('\n\n').trim();
    return cleanPDFText(combinedText);
  } catch (err) {
    console.warn('PDF.js text extraction failed:', err);
    return '';
  }
}

/**
 * Extracts raw Thai/Unicode text from an uploaded file (.txt, .docx, .pdf)
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const lowerName = file.name.toLowerCase();

  // 1. Plaintext Files (.txt)
  if (lowerName.endsWith('.txt')) {
    try {
      const text = await file.text();
      return text.trim();
    } catch (e) {
      console.error('Failed to read .txt file:', e);
      return '';
    }
  }

  // 2. Word Documents (.docx) using mammoth
  if (lowerName.endsWith('.docx')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result && typeof result.value === 'string' && result.value.trim().length > 0) {
        return result.value.trim();
      }
    } catch (e) {
      console.warn('Mammoth extraction failed:', e);
    }
  }

  // 3. PDF Files (.pdf) using PDF.js
  if (lowerName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfText = await extractTextFromPDF(arrayBuffer);
      if (pdfText && pdfText.length > 0) {
        return pdfText;
      }
    } catch (e) {
      console.warn('PDF parsing error:', e);
    }

    // If PDF text was completely unextractable (e.g. pure image scanned PDF),
    // provide a clean notice or fallback academic text, NEVER dump binary PDF syntax!
    console.warn('Could not extract text layer from PDF, file might be a scanned image.');
    return '';
  }

  return '';
}
