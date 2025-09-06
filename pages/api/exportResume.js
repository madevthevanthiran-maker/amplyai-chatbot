// /pages/api/exportResume.js
// API route to take structured resume data and generate a PDF on the fly.

import { NextApiRequest, NextApiResponse } from "next";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Utility: generate a PDF resume from structured data
async function buildResumePDF({ name, contact, summary, experience, education, skills }) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 size
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const { height } = page.getSize();
  const fontSize = 12;
  let y = height - 50;

  function drawText(text, opts = {}) {
    if (!text) return;
    page.drawText(text, {
      x: opts.x ?? 50,
      y: y,
      size: opts.size ?? fontSize,
      font,
      color: opts.color ?? rgb(0, 0, 0),
    });
    y -= opts.lineGap ?? 20;
  }

  // Header
  drawText(name, { size: 18 });
  drawText(contact, { size: 12, color: rgb(0.2, 0.2, 0.2), lineGap: 30 });

  // Summary
  if (summary) {
    drawText("Summary", { size: 14 });
    drawText(summary, { lineGap: 40 });
  }

  // Experience
  if (experience?.length) {
    drawText("Experience", { size: 14 });
    experience.forEach((job) => {
      drawText(`${job.role} — ${job.company}`, { size: 12 });
      drawText(`${job.period}`, { size: 10, color: rgb(0.3, 0.3, 0.3) });
      drawText(job.description, { lineGap: 40 });
    });
  }

  // Education
  if (education?.length) {
    drawText("Education", { size: 14 });
    education.forEach((ed) => {
      drawText(`${ed.degree} — ${ed.school}`, { size: 12 });
      drawText(`${ed.period}`, { size: 10, color: rgb(0.3, 0.3, 0.3), lineGap: 30 });
    });
  }

  // Skills
  if (skills?.length) {
    drawText("Skills", { size: 14 });
    drawText(skills.join(", "), { lineGap: 30 });
  }

  const pdfBytes = await doc.save();
  return pdfBytes;
}

export default async function handler(req = NextApiRequest, res = NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const resumeData = req.body;

    // Ensure required fields
    if (!resumeData.name || !resumeData.contact) {
      return res.status(400).json({ error: "Missing required fields: name, contact" });
    }

    const pdfBytes = await buildResumePDF(resumeData);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error("Resume export failed:", err);
    res.status(500).json({ error: "Failed to generate resume" });
  }
}
