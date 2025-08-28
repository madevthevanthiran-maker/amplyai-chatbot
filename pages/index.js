import { useState } from "react";
import Head from "next/head";

export default function Home() {
  const [jobRole, setJobRole] = useState("");
  const [layout, setLayout] = useState("Professional CV");
  const [tone, setTone] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOutput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole,
          layout,
          tone,
          resumeText,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setOutput(data.text);
      } else {
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Request failed. Please try again.");
    }

    setLoading(false);
  };

  return (
    <>
      <Head>
        <title>AmplyAI — Resume Helper</title>
        <meta
          name="description"
          content="Paste your resume, choose a layout, and tell me the job role. I’ll restructure and improve it."
        />
      </Head>

      <main className="container">
        <h1>AmplyAI — Resume Helper</h1>
        <p>
          Paste your resume, choose a layout, and tell me the job role. I’ll
          restructure and improve it.
        </p>

        <form onSubmit={handleSubmit}>
          <label>
            Job role you’re applying for
            <input
              type="text"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g., Software Engineer, Marketing Manager, Registered Nurse"
              required
            />
          </label>

          <label>
            Desired layout
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value)}
              required
            >
              <option>Professional CV</option>
              <option>One-Page Resume</option>
              <option>Academic CV</option>
              <option>Creative Portfolio Resume</option>
            </select>
          </label>
          <p className="note">
            Pick a format. E.g., Professional CV for jobs, Academic CV for
            research/teaching roles, Creative Portfolio for design/arts.
          </p>

          <details>
            <summary>Advanced (optional): Tone</summary>
            <label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                placeholder="e.g., Confident, Friendly, Concise"
              />
            </label>
          </details>

          <label>
            Current resume text
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={`Paste the section you want improved…

To get the best result, include as much as you can from the following:

• Work Experience — organisation names, city/country, position held, last drawn salary (optional), key responsibilities, quantifiable achievements, length of employment (MM/YYYY – MM/YYYY), reason for leaving (optional)
• Education — school/college/university, program/degree, graduation year, notable coursework/honours
• Certifications — name, issuer, year, credential ID/url (if any)
• Skills — technical, tools, frameworks, languages, soft skills
• Projects — name, brief description, role, outcomes/metrics, link (optional)
• Awards — name, issuer, year
• Referees — name, title, organisation, email/phone (share only if you’re comfortable)
• Hobbies / Interests — what you enjoy in your free time (optional)

If you don’t have some of these, leave them out — I’ll keep placeholders or structure around what you provide.`}
              rows={10}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? "Rewriting..." : "Rewrite my resume"}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {output && (
          <div className="output">
            <pre>{output}</pre>
          </div>
        )}

        <style jsx>{`
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            font-family: Arial, sans-serif;
          }
          h1 {
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          label {
            display: block;
            margin: 1.5rem 0 0.5rem;
            font-weight: bold;
          }
          input,
          select,
          textarea {
            width: 100%;
            padding: 0.75rem;
            margin-top: 0.25rem;
            border: 1px solid #ccc;
            border-radius: 8px;
            font-size: 1rem;
          }
          button {
            margin-top: 1.5rem;
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            background: black;
            color: white;
            font-size: 1rem;
            cursor: pointer;
          }
          button[disabled] {
            opacity: 0.7;
            cursor: not-allowed;
          }
          .error {
            margin-top: 1rem;
            padding: 1rem;
            background: #ffe6e6;
            border: 1px solid #ff4d4d;
            border-radius: 8px;
            color: #a00;
          }
          .output {
            margin-top: 2rem;
            padding: 1.5rem;
            background: #f7f7f7;
            border-radius: 8px;
          }
          .note {
            font-size: 0.85rem;
            color: #555;
            margin-top: 0.25rem;
          }
        `}</style>
      </main>
    </>
  );
}
