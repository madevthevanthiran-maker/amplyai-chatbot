// /pages/api/exportResume.js
// Generates a clean A4 PDF resume from structured JSON using pdf-lib.
// POST JSON → returns application/pdf download.
// Install deps first:  npm i pdf-lib

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// --------- layout config ----------
const PAGE_WIDTH = 595;   // A4 width
const PAGE_HEIGHT = 842;  // A4 height
const MARGIN_X = 50;
const START_Y = PAGE_HEIGHT - 50;
const LINE_GAP = 18;
const SECTION_GAP = 26;

function clampStr(v) {
  return (typeof v === "string" ? v.trim() : "");
}

// Very simple word wrapper for pdf-lib (monospace-ish using widthOfTextAtSize)
function wrapText(text, font, size, maxWidth) {
  const words = clampStr(text).split(/\s+/);
  const lines = [];
  let line = "";

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

async function buildResumePDF({
  name,
  contact,
  summary,
  experience = [],
  education = [],
  skills = [],
  projects = [],
}) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = START_Y;

  function drawLine(text, { x = MARGIN_X, size = 12, bold = false, color = rgb(0,0,0) } = {}) {
    if (!text) return;
    const f = bold ? fontBold : font;
    page.drawText(text, { x, y, size, font: f, color });
    y -= LINE_GAP;
  }

  function drawPara(text, { x = MARGIN_X, size = 12, color = rgb(0,0,0) } = {}) {
    if (!text) return;
    const wrapped = wrapText(text, font, size, PAGE_WIDTH - x - MARGIN_X);
    wrapped.forEach(line => {
      page.drawText(line, { x, y, size, font, color });
      y -= LINE_GAP;
    });
  }

  function sectionHeader(label) {
    y -= 6;
    drawLine(label, { size: 13, bold: true });
    y -= 6;
  }

  // Header
  drawLine(clampStr(name) || "Your Name", { size: 18, bold: true });
  if (contact) {
    drawLine(contact, { size: 11, color: rgb(0.25,0.25,0.25) });
    y -= 6;
  }

  // Summary
  if (summary) {
    sectionHeader("Summary");
    drawPara(summary);
    y -= SECTION_GAP;
  }

  // Experience
  if (Array.isArray(experience) && experience.length) {
    sectionHeader("Experience");
    experience.forEach((job) => {
      const role = clampStr(job.role);
      const company = clampStr(job.company);
      const title = [role, company && `— ${company}`].filter(Boolean).join(" ");
      if (title) drawLine(title, { bold: true });
      if (job.period) drawLine(job.period, { size: 10, color: rgb(0.35,0.35,0.35) });
      if (job.description) drawPara(job.description);
      y -= SECTION_GAP;
    });
  }

  // Projects (optional)
  if (Array.isArray(projects) && projects.length) {
    sectionHeader("Projects");
    projects.forEach((p) => {
      const title = clampStr(p.name);
      if (title) drawLine(title, { bold: true });
      if (p.link) drawLine(p.link, { size: 10, color: rgb(0.2,0.3,0.8) });
      if (p.description) drawPara(p.description);
      y -= SECTION_GAP;
    });
  }

  // Education
  if (Array.isArray(education) && education.length) {
    sectionHeader("Education");
    education.forEach((ed) => {
      const degree = clampStr(ed.degree);
      const school = clampStr(ed.school);
      const title = [degree, school && `— ${school}`].filter(Boolean).join(" ");
      if (title) drawLine(title, { bold: true });
      if (ed.period) drawLine(ed.period, { size: 10, color: rgb(0.35,0.35,0.35) });
      y -= 10;
    });
    y -= SECTION_GAP / 2;
  }

  // Skills
  if (Array.isArray(skills) && skills.length) {
    sectionHeader("Skills");
    drawPara(skills.join(", "));
    y -= SECTION_GAP;
  }

  const pdfBytes = await doc.save();
  return pdfBytes;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const data = req.body || {};
    if (!data.name || !data.contact) {
      return res
        .status(400)
        .json({ error: "Missing required fields: name, contact" });
    }

    const pdfBytes = await buildResumePDF(data);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("Resume export failed:", err);
    res.status(500).json({ error: "Failed to generate resume" });
  }
}
