import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.min.mjs';

// ─── State ───────────────────────────────────────────────
let pdfDoc = null;       // pdf.js document
let pdfLibDoc = null;    // pdf-lib document (for editing)
let currentPage = 1;
let zoom = 1.0;
let pdfBytes = null;     // raw bytes for pdf-lib

// ─── DOM refs ────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const canvasContainer = $('canvas-container');
const dropZone = $('drop-zone');
const fileInput = $('file-input');
const mergeInput = $('merge-input');
const pageNav = $('page-nav');
const pageIndicator = $('page-indicator');
const zoomIndicator = $('zoom-indicator');

// ─── Open PDF ────────────────────────────────────────────
$('btn-open').addEventListener('click', () => fileInput.click());
dropZone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) loadPDF(e.target.files[0]);
});

// Drag & drop
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type === 'application/pdf') loadPDF(file);
});

async function loadPDF(file) {
  pdfBytes = await file.arrayBuffer();
  const data = new Uint8Array(pdfBytes);

  // pdf.js for rendering
  pdfDoc = await pdfjsLib.getDocument({ data }).promise;

  // pdf-lib for editing (keep a copy)
  pdfLibDoc = await PDFLib.PDFDocument.load(pdfBytes);

  dropZone.classList.add('hidden');
  canvasContainer.classList.remove('hidden');

  renderPageNav();
  renderPage(1);
}

// ─── Render ──────────────────────────────────────────────
async function renderPage(num) {
  currentPage = num;
  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: zoom });

  // Remove old canvas
  canvasContainer.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvasContainer.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  pageIndicator.textContent = `Page ${num} of ${pdfDoc.numPages}`;
  zoomIndicator.textContent = `${Math.round(zoom * 100)}%`;

  // Highlight active page in nav
  document.querySelectorAll('.page-thumb').forEach((el, i) => {
    el.classList.toggle('active', i + 1 === num);
  });
}

function renderPageNav() {
  pageNav.innerHTML = '';
  for (let i = 1; i <= pdfDoc.numPages; i++) {
    const div = document.createElement('div');
    div.className = 'page-thumb';
    div.textContent = `Page ${i}`;
    div.addEventListener('click', () => renderPage(i));
    pageNav.appendChild(div);
  }
}

// ─── Zoom ────────────────────────────────────────────────
$('zoom-in').addEventListener('click', () => { zoom = Math.min(zoom + 0.25, 4); if (pdfDoc) renderPage(currentPage); });
$('zoom-out').addEventListener('click', () => { zoom = Math.max(zoom - 0.25, 0.5); if (pdfDoc) renderPage(currentPage); });

// ─── Merge PDFs ──────────────────────────────────────────
$('btn-merge').addEventListener('click', () => mergeInput.click());

mergeInput.addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length || !pdfLibDoc) return;

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const otherDoc = await PDFLib.PDFDocument.load(bytes);
    const pages = await pdfLibDoc.copyPages(otherDoc, otherDoc.getPageIndices());
    pages.forEach((p) => pdfLibDoc.addPage(p));
  }

  // Reload viewer with merged doc
  const mergedBytes = await pdfLibDoc.save();
  pdfBytes = mergedBytes;
  pdfDoc = await pdfjsLib.getDocument({ data: mergedBytes }).promise;
  pdfLibDoc = await PDFLib.PDFDocument.load(mergedBytes);
  renderPageNav();
  renderPage(1);
  mergeInput.value = '';
});

// ─── Rotate current page ─────────────────────────────────
$('btn-rotate').addEventListener('click', async () => {
  if (!pdfLibDoc) return;
  const page = pdfLibDoc.getPage(currentPage - 1);
  const current = page.getRotation().angle;
  page.setRotation(PDFLib.degrees((current + 90) % 360));

  const newBytes = await pdfLibDoc.save();
  pdfBytes = newBytes;
  pdfDoc = await pdfjsLib.getDocument({ data: newBytes }).promise;
  pdfLibDoc = await PDFLib.PDFDocument.load(newBytes);
  renderPage(currentPage);
});

// ─── Add Text ────────────────────────────────────────────
$('btn-addtext').addEventListener('click', () => {
  $('text-input-area').classList.toggle('hidden');
});

$('btn-apply-text').addEventListener('click', async () => {
  if (!pdfLibDoc) return;
  const text = $('text-input').value;
  if (!text) return;

  const x = parseFloat($('text-x').value) || 50;
  const y = parseFloat($('text-y').value) || 700;
  const size = parseFloat($('text-size').value) || 24;

  const page = pdfLibDoc.getPage(currentPage - 1);
  const font = await pdfLibDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  page.drawText(text, { x, y, size, font, color: PDFLib.rgb(0, 0, 0) });

  const newBytes = await pdfLibDoc.save();
  pdfBytes = newBytes;
  pdfDoc = await pdfjsLib.getDocument({ data: newBytes }).promise;
  pdfLibDoc = await PDFLib.PDFDocument.load(newBytes);
  renderPage(currentPage);
});

// ─── Save / Download ─────────────────────────────────────
$('btn-save').addEventListener('click', async () => {
  if (!pdfLibDoc) return;
  const bytes = await pdfLibDoc.save();
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'jcrobat-output.pdf';
  a.click();
  URL.revokeObjectURL(url);
});   
