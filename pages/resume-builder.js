// pages/resume-builder.js
export default function ResumeBuilderRedirect() {
  if (typeof window !== "undefined") window.location.replace("/hire-helper");
  return null;
}
