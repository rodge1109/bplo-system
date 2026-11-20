// PDF Assessment Extractor for City of Bogo BPLO Business Assessment Form (QF-BPLO-04)
// Starts reading at the "Business Tax" line and extracts all itemized charges up to SUB TOTAL / GRAND TOTAL

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
 * Extract visual horizontal text lines AND full page text tokens from a PDF File using PDF.js
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
      const lineStr = row.items.map((i) => i.text).join(' ').trim();
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
        lines.push(currentLine.join(' '));
        currentLine = [];
      }
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine.join(' '));
  }
  return lines;
}

/**
 * Specialized parser for City of Bogo BUSINESS ASSESSMENT FORM (QF-BPLO-04)
 * Starts reading at the "Business Tax" line and stops at "SUB TOTAL" / "GRAND TOTAL"
 */
function parseBogoAssessmentFormLines(lines) {
  // 1. Find the "Business Tax" section start line
  let startIdx = lines.findIndex((l) => /^business\s+tax$/i.test(l.trim()));
  if (startIdx === -1) {
    // Also check if "Business Tax" appears right after "Charge Code Year Particulars..."
    startIdx = lines.findIndex(
      (l, idx) =>
        /\bbusiness\s+tax\b/i.test(l) &&
        !/\bbusiness\s+tax\s*-/i.test(l) &&
        idx > 2
    );
  }

  if (startIdx === -1) return [];

  // 2. Collect all tokens/lines from "Business Tax" until "SUB TOTAL" or "GRAND TOTAL" or "We declare"
  const relevantLines = [];
  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i].replace(/\s+/g, ' ').trim();
    if (!line) continue;

    if (
      /^(sub\s*total|grand\s*total|we\s+declare\s+the\s+penalties|assessment\s+prepared\s+by)/i.test(
        line
      )
    ) {
      break;
    }
    relevantLines.push(line);
  }

  // Known section headers in QF-BPLO-04
  const sectionHeaderMap = {
    'business tax': 'Business Tax',
    'regulatory fees': 'Regulatory Fees',
    'regulatory fee': 'Regulatory Fees',
    'seal': 'Seal',
    'service fees': 'Service Fees',
    'service fee': 'Service Fees'
  };

  // Pre-merge wrapped multi-line rows in QF-BPLO-04:
  // In QF-BPLO-04, a row like:
  //   "1006 2026 Business Tax - Banks and Other Financial 150.00 0.00 0.00 150.00"
  //   "Institutions || Micro Lending-2026"
  // or:
  //   "Business Tax - Banks and Other Financial"
  //   "1006 2026 150.00 0.00 0.00 150.00"
  //   "Institutions || Micro Lending-2026"
  // can split across adjacent Y-lines depending on PDF cell vertical alignment.
  // Let's normalize the stream between section headers & TOTAL lines!
  const charges = [];
  let currentCategory = 'Business Tax';
  let pendingBuffer = [];

  const flushBuffer = () => {
    if (pendingBuffer.length === 0) return;
    const combined = pendingBuffer.join(' ').replace(/\s+/g, ' ').trim();
    pendingBuffer = [];

    if (!combined) return;

    // Split combined chunk if multiple charge items (each starting with 4-digit charge code + 4-digit year) got grouped
    const itemRegex = /\b(\d{4})\s+(20\d{2})\b/g;
    const matches = [...combined.matchAll(itemRegex)];

    if (matches.length > 0) {
      for (let mIdx = 0; mIdx < matches.length; mIdx++) {
        const match = matches[mIdx];
        const segStart = mIdx === 0 ? 0 : match.index;
        const segEnd = mIdx + 1 < matches.length ? matches[mIdx + 1].index : combined.length;
        const segment = combined.slice(segStart, segEnd).trim();
        const parsedItem = parseSingleBogoRow(segment, match[1], match[2], currentCategory);
        if (parsedItem) {
          charges.push(parsedItem);
        }
      }
    } else {
      // Fallback if row had no 4-digit charge code + year
      const parsedItem = parseSingleBogoRow(combined, '', '', currentCategory);
      if (parsedItem) {
        charges.push(parsedItem);
      }
    }
  };

  for (const line of relevantLines) {
    const lower = line.toLowerCase();

    // Check if this line is a section header
    if (sectionHeaderMap[lower]) {
      flushBuffer();
      currentCategory = sectionHeaderMap[lower];
      continue;
    }

    // Check if this line is a section TOTAL line (e.g. "TOTAL 650.00 0.00 0.00 650.00")
    if (/^total\b/i.test(line)) {
      flushBuffer();
      continue;
    }

    // If line starts with a new 4-digit Charge Code + 4-digit Year and pendingBuffer already has a complete row (with amounts), flush first
    const startsWithCodeYear = /^\d{4}\s+20\d{2}\b/.test(line);
    const bufferHasAmount = pendingBuffer.some((l) => /\d+\.\d{2}/.test(l));
    const bufferHasCodeYear = pendingBuffer.some((l) => /\b\d{4}\s+20\d{2}\b/.test(l));

    if (startsWithCodeYear && bufferHasCodeYear && bufferHasAmount) {
      flushBuffer();
    }

    pendingBuffer.push(line);
  }

  flushBuffer();
  return charges;
}

/**
 * Parse a single row segment from QF-BPLO-04 into an assessment charge object
 */
function parseSingleBogoRow(segment, chargeCode, year, category) {
  let working = segment.trim();

  // Remove the chargeCode and year from the working string
  if (chargeCode && year) {
    const codeYearPattern = new RegExp(`\\b${chargeCode}\\s+${year}\\b`);
    working = working.replace(codeYearPattern, ' ').replace(/\s+/g, ' ').trim();
  }

  // Find all decimal numbers formatted like 1,234.56 or 500.00 in the segment
  const decimalRegex = /(?:php|₱)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\.[0-9]{2}\b/gi;
  const amountMatches = [...working.matchAll(decimalRegex)];

  if (amountMatches.length === 0) return null;

  // In QF-BPLO-04, the columns are: Tax Amount | Discount | Offset | Total Amount
  // So the last decimal number is Total Amount (and the first of the 4 is Tax Amount)
  const lastMatch = amountMatches[amountMatches.length - 1];
  const rawTotal = lastMatch[0].replace(/[^\d.]/g, '');
  const amount = parseFloat(rawTotal);

  if (isNaN(amount) || amount <= 0) return null;

  // Remove the trailing numeric columns (up to 4 decimal numbers: Tax Amount, Discount, Offset, Total Amount) from description
  let description = working;
  const columnsToStrip = amountMatches.slice(-4);
  for (const m of columnsToStrip) {
    description = description.replace(m[0], ' ');
  }

  description = description.replace(/\s+/g, ' ').trim();
  if (!description || /^total\b/i.test(description)) return null;

  return {
    id: chargeCode ? `code_${chargeCode}` : `pdf_charge_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    chargeCode: chargeCode || '',
    year: year || '2026',
    description: chargeCode ? `${description}` : description,
    category: category || 'Regulatory Fees',
    amount,
    isRegulatory: category !== 'Business Tax' && category !== 'Local Tax',
    isFsic: false
  };
}

/**
 * Determine fee category based on description keywords for generic PDFs
 */
function detectFeeCategory(description, rawLine = '') {
  const lower = `${description} ${rawLine}`.toLowerCase();
  if (
    lower.includes('local tax') ||
    lower.includes('business tax') ||
    lower.includes('lbt') ||
    lower.includes('mayors & business permit')
  ) {
    return 'Business Tax';
  }
  if (lower.includes('security seal') || lower.includes('seal - bplo')) {
    return 'Seal';
  }
  if (lower.includes('plate sticker') || lower.includes('service fee')) {
    return 'Service Fees';
  }
  if (
    lower.includes('penalty') ||
    lower.includes('surcharge') ||
    lower.includes('interest')
  ) {
    return 'Penalty / Surcharge';
  }
  return 'Regulatory Fees';
}

/**
 * Parse extracted PDF text lines into structured BPLO assessment charges
 */
export function parseLinesToAssessmentCharges(lines) {
  // 1. First try the official City of Bogo BUSINESS ASSESSMENT FORM (QF-BPLO-04) parser starting at "Business Tax"
  const bogoCharges = parseBogoAssessmentFormLines(lines);
  if (bogoCharges.length > 0) {
    return bogoCharges;
  }

  // 2. Fallback generic line-item parser for other assessment PDF layouts
  const charges = [];
  const ignorePattern =
    /^(total(\s+amount)?(\s+due)?|grand\s+total|sub[-\s]?total|net\s+amount|amount\s+due|amount\s+paid|total\s+assessed|consolidated\s+local\s+taxes|tax\s+order\s+of\s+payment|business\s+assessment\s+form|fee\s+description|particulars|charge\s+code|page\s+\d+|date\s*:|reference\s*no|application\s*no|account\s*no|business\s*id|tin\s*:|or\s*no|official\s+receipt|republic\s+of\s+the\s+philippines|province\s+of|city\s+of\s+bogo|business\s+permit\s+and\s+licensing)/i;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    if (!line || line.length < 4) continue;

    if (/^(sub\s*total|grand\s*total|total)\b/i.test(line)) continue;

    // Match trailing decimal amount(s)
    const decimalRegex = /(?:php|₱)?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]+)\.[0-9]{2}\b/gi;
    const decMatches = [...line.matchAll(decimalRegex)];
    if (decMatches.length === 0) continue;

    const lastDec = decMatches[decMatches.length - 1];
    const amount = parseFloat(lastDec[0].replace(/[^\d.]/g, ''));
    if (isNaN(amount) || amount <= 0 || amount > 50000000) continue;

    // Strip up to 4 trailing decimal columns (Tax Amount, Discount, Offset, Total Amount)
    const firstDecIdx = decMatches.length >= 4 ? decMatches[decMatches.length - 4].index : lastDec.index;
    let descPart = line.slice(0, firstDecIdx).trim();

    // Strip leading Charge Code + Year (e.g. "1011 2026 ") or item number ("1.")
    let chargeCode = '';
    const codeYearMatch = descPart.match(/^(\d{4})\s+(20\d{2})\s+/);
    if (codeYearMatch) {
      chargeCode = codeYearMatch[1];
      descPart = descPart.slice(codeYearMatch[0].length).trim();
    } else {
      descPart = descPart.replace(/^(?:#?\d{1,2}[.)]?)\s+/, '').trim();
    }

    const categoryRegex = /\b(Business\s+Tax|Local\s+Tax|Regulatory\s+Fees?|Seal|Service\s+Fees?|Clearance\s+Fee|Penalty\s*\/?\s*Surcharge)\s*$/i;
    let explicitCategory = null;
    const catMatch = descPart.match(categoryRegex);
    if (catMatch) {
      explicitCategory = catMatch[1];
      descPart = descPart.replace(categoryRegex, '').trim();
    }

    descPart = descPart.replace(/[.\-_:|₱]+$/, '').replace(/\b(Php|PHP)\s*$/i, '').trim();
    if (!descPart || descPart.length < 3) continue;
    if (ignorePattern.test(descPart) || /^total\b/i.test(descPart)) continue;
    if (!/[a-zA-Z]/.test(descPart)) continue;

    const category = explicitCategory
      ? explicitCategory.replace(/\s+/g, ' ')
      : detectFeeCategory(descPart, line);

    charges.push({
      id: chargeCode ? `code_${chargeCode}` : `pdf_charge_${charges.length + 1}_${Date.now()}`,
      chargeCode,
      description: descPart,
      category,
      amount,
      isRegulatory: category !== 'Business Tax' && category !== 'Local Tax',
      isFsic: false
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
