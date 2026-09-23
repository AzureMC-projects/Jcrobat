import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.min.mjs';

// ✅ THE FIX — worker must be set BEFORE any getDocument call
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/6.3.289/pdf.worker.min.mjs';

// ─── State ───────────────────────────────────────────────
let pdfDoc = null;
let pdfLibDoc = null;
let currentPage = 1;
let zoom = 1.0;
let activeTool = null;
let drawing = false;
let drawStart = null;

// ─── DOM ─────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const canvasContainer = $('canvas-container');
const overlayCanvas = $('overlay-canvas');
const overlayCtx = overlayCanvas.getContext('2d');
const pageNav = $('page-nav');
const toolIndicator = $('tool-indicator');

// ─── INIT: Generate sample PDF on load ───────────────────
async function init() {
  const doc = await PDFLib.PDFDocument.create();
  const font = await doc.embedFont(PDFLib.StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(PDFLib.StandardFonts.HelveticaBold);

  for (let i = 1; i <= 3; i++) {
    const page = doc.addPage([612, 792]);
    page.drawText('Jcrobat - Sample Document', { x: 50, y: 720, size: 28, font: fontBold, color: PDFLib.rgb(0.1, 0.2, 0.6) });
    page.drawText(`Page ${i}`, { x: 50, y: 680, size: 18, font });
    page.drawText('This is a pre-loaded document.', { x: 50, y: 640, size: 14, font });
    page.drawText('Edit it, add text, highlight, draw,', { x: 50, y: 620, size: 14, font });
    page.drawText('merge, split, rotate — then download.', { x: 50, y: 600, size: 14, font });
    page.drawLine({ start: { x: 50, y: 570 }, end: { x: 562, y: 570 }, thickness: 1, color: PDFLib.rgb(0.5, 0.5, 0.5) });
    page.drawText('Try the toolbar buttons above!', { x: 50, y: 550, size: 14, font });
  }

  const bytes = await doc.save();
  await loadPDFBytes(bytes);
}

// ─── Core: Load PDF from bytes ───────────────────────────
async function loadPDFBytes(bytes) {
  const data = new Uint8Array(bytes);
  pdfDoc = await pdfjsLib.getDocument({ data: data.slice() }).promise;
  pdfLibDoc = await PDFLib.PDFDocument.load(data);
  currentPage = 1;
  renderPageNav();
  await renderPage(1);
}

// ─── Open file (optional) ────────────────────────────────
$('btn-open').addEventListener('click', () => $('file-input').click());
$('file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    const bytes = await file.arrayBuffer();
    await loadPDFBytes(bytes);
  }
});

// ─── Render ──────────────────────────────────────────────
async function renderPage(num) {
  currentPage = num;
  const page = await pdfDoc.getPage(num);
  const viewport = page.getViewport({ scale: zoom });

  canvasContainer.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvasContainer.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;

  // Size & position overlay to match canvas
  overlayCanvas.width = viewport.width;
  overlayCanvas.height = viewport.height;
  overlayCanvas.style.width = viewport.width + 'px';
  overlayCanvas.style.height = viewport.height + 'px';
  // Position overlay on top of the rendered canvas
  const canvasRect = canvas.getBoundingClientRect();
  const viewerRect = $('viewer').getBoundingClientRect();
  overlayCanvas.style.position = 'absolute';
  overlayCanvas.style.left = (canvasRect.left - viewerRect.left + $('viewer').scrollLeft) + 'px';
  overlayCanvas.style.top = (canvasRect.top - viewerRect.top + $('viewer').scrollTop) + 'px';
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  $('page-indicator').textContent = `Page ${num} of ${pdfDoc.numPages}`;
  $('zoom-indicator').textContent = `${Math.round(zoom * 100)}%`;

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
$('zoom-in').addEventListener('click', () => { zoom = Math.min(zoom + 0.25, 4); renderPage(currentPage); });
$('zoom-out').addEventListener('click', () => { zoom = Math.max(zoom - 0.25, 0.5); renderPage(currentPage); });

// ─── Merge ───────────────────────────────────────────────
$('btn-merge').addEventListener('click', () => $('merge-input').click());
$('merge-input').addEventListener('change', async (e) => {
  const files = Array.from(e.target.files);
  if (!files.length || !pdfLibDoc) return;
  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const otherDoc = await PDFLib.PDFDocument.load(bytes);
    const pages = await pdfLibDoc.copyPages(otherDoc, otherDoc.getPageIndices());
    pages.forEach((p) => pdfLibDoc.addPage(p));
  }
  const newBytes = await pdfLibDoc.save();
  await loadPDFBytes(newBytes);
  $('merge-input').value = '';
});

// ─── Split / Extract ─────────────────────────────────────
$('btn-split').addEventListener('click', () => $('split-input-area').classList.toggle('hidden'));

$('btn-apply-split').addEventListener('click', async () => {
  const rangeStr = $('split-range').value.trim();
  if (!rangeStr || !pdfLibDoc) return;
  const indices = parseRange(rangeStr, pdfLibDoc.getPageCount());
  if (!indices.length) return;
  const newDoc = await PDFLib.PDFDocument.create();
  const pages = await newDoc.copyPages(pdfLibDoc, indices);
  pages.forEach((p) => newDoc.addPage(p));
  const bytes = await newDoc.save();
  await loadPDFBytes(bytes);
  $('split-input-area').classList.add('hidden');
});

function parseRange(str, total) {
  const parts = str.split(',').map(s => s.trim());
  const result = [];
  for (const part of parts) {
    if (part.includes('-')) {
      const [a, b] = part.split('-').map(Number);
      for (let i = a; i <= b && i <= total; i++) if (i >= 1) result.push(i - 1);
    } else {
      const n = parseInt(part);
      if (n >= 1 && n <= total) result.push(n - 1);
    }
  }
  return [...new Set(result)];
}

// ─── Delete Page ─────────────────────────────────────────
$('btn-delete-page').addEventListener('click', async () => {
  if (!pdfLibDoc || pdfLibDoc.getPageCount() <= 1) return;
  pdfLibDoc.removePage(currentPage - 1);
  const bytes = await pdfLibDoc.save();
  await loadPDFBytes(bytes);
});

// ─── Rotate ──────────────────────────────────────────────
$('btn-rotate').addEventListener('click', async () => {
  if (!pdfLibDoc) return;
  const page = pdfLibDoc.getPage(currentPage - 1);
  const current = page.getRotation().angle || 0;
  page.setRotation(PDFLib.degrees((current + 90) % 360));
  const bytes = await pdfLibDoc.save();
  await loadPDFBytes(bytes);
});

// ─── Add Text ────────────────────────────────────────────
$('btn-addtext').addEventListener('click', () => {
  $('text-input-area').classList.toggle('hidden');
  $('split-input-area').classList.add('hidden');
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
  const bytes = await pdfLibDoc.save();
  await loadPDFBytes(bytes);
});

// ─── Highlight ───────────────────────────────────────────
$('btn-highlight').addEventListener('click', () => {
  setActiveTool(activeTool === 'highlight' ? null : 'highlight');
});

// ─── Draw ────────────────────────────────────────────────
$('btn-draw').addEventListener('click', () => {
  setActiveTool(activeTool === 'draw' ? null : 'draw');
});

function setActiveTool(tool) {
  activeTool = tool;
  overlayCanvas.classList.toggle('hidden', !tool);
  toolIndicator.textContent = tool ? `Tool: ${tool}` : '';
  document.querySelectorAll('.toolbar-actions button').forEach(b => b.classList.remove('active'));
  if (tool === 'highlight') $('btn-highlight').classList.add('active');
  if (tool === 'draw') $('btn-draw').classList.add('active');
}

overlayCanvas.addEventListener('mousedown', (e) => {
  if (!activeTool) return;
  drawing = true;
  drawStart = { x: e.offsetX, y: e.offsetY };
});

overlayCanvas.addEventListener('mousemove', (e) => {
  if (!drawing || !activeTool) return;
  const x = e.offsetX, y = e.offsetY;
  if (activeTool === 'draw') {
    overlayCtx.beginPath();
    overlayCtx.moveTo(drawStart.x, drawStart.y);
    overlayCtx.lineTo(x, y);
    overlayCtx.strokeStyle = '#f38ba8';
    overlayCtx.lineWidth = 2;
    overlayCtx.stroke();
  } else if (activeTool === 'highlight') {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    overlayCtx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    overlayCtx.fillRect(
      Math.min(drawStart.x, x), Math.min(drawStart.y, y),
      Math.abs(x - drawStart.x), Math.abs(y - drawStart.y)
    );
  }
});

overlayCanvas.addEventListener('mouseup', async (e) => {
  if (!drawing || !activeTool) return;
  drawing = false;
  const x = e.offsetX, y = e.offsetY;

  const page = pdfLibDoc.getPage(currentPage - 1);
  const { width, height } = page.getSize();
  const scaleX = width / overlayCanvas.width;
  const scaleY = height / overlayCanvas.height;

  if (activeTool === 'highlight') {
    const pdfX1 = Math.min(drawStart.x, x) * scaleX;
    const pdfX2 = Math.max(drawStart.x, x) * scaleX;
    const pdfY1 = height - Math.max(drawStart.y, y) * scaleY;
    const pdfY2 = height - Math.min(drawStart.y, y) * scaleY;
    page.drawRectangle({
      x: pdfX1, y: pdfY1,
      width: pdfX2 - pdfX1, height: pdfY2 - pdfY1,
      color: PDFLib.rgb(1, 1, 0), opacity: 0.4
    });
  } else if (activeTool === 'draw') {
    page.drawLine({
      start: { x: drawStart.x * scaleX, y: height - drawStart.y * scaleY },
      end: { x: x * scaleX, y: height - y * scaleY },
      thickness: 2,
      color: PDFLib.rgb(0.95, 0.32, 0.43)
    });
  }

  const bytes = await pdfLibDoc.save();
  await loadPDFBytes(bytes);
  setActiveTool(null);
});

// ─── Reorder Pages ───────────────────────────────────────
$('btn-page-up').addEventListener('click', async () => {
  if (!pdfLibDoc || currentPage <= 1) return;
  const a = currentPage - 2, b = currentPage - 1;
  const temp = pdfLibDoc.getPage(a);
  pdfLibDoc.insertPage(a, pdfLibDoc.getPage(b));
  pdfLibDoc.removePage(b + 1);
  pdfLibDoc.insertPage(b, temp);
  pdfLibDoc.removePage(a);
  const bytes = await pdfLibDoc.save();
  await loadPDFBytes(bytes);
});

$('btn-page-down').addEventListener('click', async () => {
  if (!pdfLibDoc || currentPage >= pdfDoc.numPages) return;
  const a = currentPage - 1, b = currentPage;
  const temp = pdfLibDoc.getPage(a);
  pdfLibDoc.insertPage(a, pdfLibDoc.getPage(b));
  pdfLibDoc.removePage(b + 1);
  pdfLibDoc.insertPage(b, temp);
  pdfLibDoc.removePage(a);
  const bytes = await pdfLibDoc.save();
  await loadPDFBytes(bytes);
});

// ─── Download ────────────────────────────────────────────
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

// ─── GO ──────────────────────────────────────────────────
init();   
