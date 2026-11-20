// PDF Assessment Extractor for BPLO Tax Order of Payment (TOP)
// Extracts itemized fee descriptions and PHP amounts from an uploaded Assessment PDF

const PDFJS_CDN_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfjsLibPromise = null;

/**
 * Dynamically load PDF.js from CDN
 */
function loadPdfJs() {
  if (typeof window !== 'undefined' && window.pdfjsLib) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
    return Promise.resolve(window.pdfjsLib);
  }

  if (pdfjsLibPromise) return pdfjsLibPromise;

  pdfjsLibPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PDFJS_CDN_URL;
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;
        resolve(window.pdfjsLib);
      } else {
        reject(new Error('PDF.js loaded but pdfjsLib not found on window.'));
      }
    };
    script.onerror = () => {
      pdfjsLibPromise = null;
      reject(new Error('Failed to load PDF parser library from CDN.'));
    };
    document.head.appendChild(script);
  });

  return pdfjsLibPromise;
}

/**
 * Extract visual horizontal text lines from a PDF File using PDF.js
 */
async function extractLinesWithPdfJs(arrayBuffer) {
  const pdfjsLib = await loadPdfJs();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  const allLines = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group text items by Y coordinate (tolerance of 4.5 units for same visual row)
    const rows = [];
    for (const item of textContent.items) {
      const text = (item.str || '').trim();
      if (!text) continue;

      const x = item.transform ? item.transform[4] : 0;
      const y = item.transform ? item.transform[5] : 0;

      let existingRow = rows.find((r) => Math.abs(r.y - y) <= 4.5);
      if (existingRow) {
        existingRow.items.push({ x, text });
      } else {
        rows.push({ y, items: [{ x, text }] });
      }
    }

    // Sort rows top-to-bottom (higher Y is higher on PDF page)
    rows.sort((a, b) => b.y - a.y);

    // Sort items within each row left-to-right (smaller X first)
    for (const row of rows) {
      row.items.sort((a, b) => a.x - b.x);
      const lineStr = row.items.map((i) => i.text).join('  ').trim();
      if (lineStr) {
        allLines.push(lineStr);
      }
    }
  }

  return allLines;
}

/**
 * Fallback raw text extractor for simple uncompressed PDFs if offline
 */
function extractLinesFallback(arrayBuffer) {
  const decoder = new TextDecoder('latin1');
  const raw = decoder.decode(arrayBuffer);
  const lines = [];

  // Match literal strings inside parentheses (...) in PDF content streams
  const matches = raw.match(/\(([^()\\]|\\.)+\)/g) || [];
  let currentLine = [];
  for (const m of matches) {
    const clean = m
      .slice(1, -1)
      .replace(/\\([()\\])/g, '$1')
      .trim();
    if (clean && /^[\x20-\x7E₱]+$/.test(clean)) {
      currentLine.push(clean);
      if (/\d+\.\d{2}$/.test(clean)) {
        lines.push(currentLine.join('  '));
        currentLine = [];
      }
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.join('  '));
  }
  return lines;
}

/**
 * Determine fee category based on description keywords
 */
function detectFeeCategory(description, rawLine = '') {
  const lower = `${description} ${rawLine}`.toLowerCase();
  if (
    lower.includes('local tax') ||
    lower.includes('business tax') ||
    lower.includes('lbt') ||
    lower.includes('franchise tax') ||
    lower.includes('amusement tax')
  ) {
    return 'Local Tax';
  }
  if (
    lower.includes('penalty') ||
    lower.includes('surcharge') ||
    lower.includes('interest') ||
    lower.includes('compromise')
  ) {
    return 'Penalty / Surcharge';
  }
  if (
    lower.includes('clearance') ||
    lower.includes('zoning') ||
    lower.includes('locational')
  ) {
    return 'Clearance Fee';
  }
  return 'Regulatory Fee';
}

/**
 * Parse extracted PDF text lines into structured BPLO assessment charges:
 * [{ id, description, category, amount, isRegulatory, isFsic }]
 */
export function parseLinesToAssessmentCharges(lines) {
  const charges = [];

  // Patterns to ignore (headers, totals, metadata)
  const ignorePattern =
    /^(total(\s+amount)?(\s+due)?|grand\s+total|sub[-\s]?total|net\s+amount|amount\s+due|amount\s+paid|total\s+assessed|consolidated\s+local\s+taxes|tax\s+order\s+of\s+payment|fee\s+description|particulars|nature\s+of\s+collection|page\s+\d+|date\s*:|reference\s*no|application\s*no|account\s*no|tin\s*:|or\s*no|official\s+receipt|republic\s+of\s+the\s+philippines|province\s+of|city\s+of\s+bogo|business\s+permit\s+and\s+licensing)/i;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    if (!line || line.length < 4) continue;

    // Match an amount at the end of the line (e.g. "Php 1,250.00", "₱500.00", "2,012.50", "300")
    const amountMatch = line.match(
      /(?:php|₱|p\b)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)(?:\.([0-9]{2}))?\s*$/i
    );
    if (!amountMatch) continue;

    const wholePart = amountMatch[1].replace(/,/g, '');
    const decimalPart = amountMatch[2] || '00';
    const amount = parseFloat(`${wholePart}.${decimalPart}`);

    // Skip zero or unrealistic numbers (like years 2025/2026 when there's no decimal and no fee keyword)
    if (isNaN(amount) || amount <= 0 || amount > 50000000) continue;
    if (!amountMatch[2] && (amount === 2024 || amount === 2025 || amount === 2026 || amount === 11032 || amount === 9514)) {
      continue;
    }

    // Extract description before the matched amount
    let descPart = line.slice(0, amountMatch.index).trim();

    // Remove leading item numbers like "1", "1.", "01)", "#2"
    descPart = descPart.replace(/^(?:#?\d{1,2}[.)]?)\s+/, '').trim();

    // Remove trailing category column text if present in the row
    const categoryRegex = /\b(Local\s+Tax|Regulatory\s+Fee|Clearance\s+Fee|Penalty\s*\/?\s*Surcharge)\s*$/i;
    let explicitCategory = null;
    const catMatch = descPart.match(categoryRegex);
    if (catMatch) {
      explicitCategory = catMatch[1];
      descPart = descPart.replace(categoryRegex, '').trim();
    }

    // Clean trailing dots, dashes, or currency markers
    descPart = descPart.replace(/[.\-_:|₱]+$/, '').replace(/\b(Php|PHP)\s*$/i, '').trim();

    // Remove duplicate "15% to BFP" badge text if it got merged into description
    descPart = descPart.replace(/\s+15%\s+to\s+BFP$/i, '').trim();

    if (!descPart || descPart.length < 3) continue;
    if (ignorePattern.test(descPart) || /^total\b/i.test(descPart)) continue;

    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(descPart)) continue;

    const category = explicitCategory
      ? explicitCategory.replace(/\s+/g, ' ')
      : detectFeeCategory(descPart, line);

    const lowerDesc = descPart.toLowerCase();
    const isFsic =
      lowerDesc.includes('fire safety') ||
      lowerDesc.includes('fsic') ||
      lowerDesc.includes('15% to bfp');

    charges.push({
      id: isFsic
        ? 'fsic_fee'
        : lowerDesc.includes('local business tax') || lowerDesc.includes('lbt')
        ? 'lbt'
        : `pdf_charge_${charges.length + 1}_${Date.now()}`,
      description: descPart,
      category,
      amount,
      isRegulatory: category === 'Regulatory Fee' && !isFsic,
      isFsic
    });
  }

  return charges;
}

/**
 * Main entry point: takes a PDF File object and returns extracted assessment charges + raw lines
 */
export async function extractAssessmentFromPdf(file) {
  const arrayBuffer = await file.arrayBuffer();
  let lines = [];

  try {
    lines = await extractLinesWithPdfJs(arrayBuffer);
  } catch (err) {
    console.warn('PDF.js extraction notice, trying fallback parser:', err);
    lines = extractLinesFallback(arrayBuffer);
  }

  const charges = parseLinesToAssessmentCharges(lines);
  return {
    charges,
    rawLines: lines
  };
}

