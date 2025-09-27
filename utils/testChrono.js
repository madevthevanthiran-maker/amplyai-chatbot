// utils/testChrono.js
import chrono from "chrono-node";

const tests = [
  "block 2-4pm tomorrow",
  "next wed 14:30 call with supplier",
  "remind me next Fri at 5pm",
  "meeting from 9 to 11 next Mon",
];

console.log("🧪 Starting chrono-node test...");

for (const sentence of tests) {
  console.log("---");
  console.log("Input:", sentence);
  const result = chrono.parse(sentence);
  console.log("Parsed:", result);
  if (result.length > 0) {
    console.log("Start:", result[0].start?.date());
    if (result[0].end) console.log("End:", result[0].end.date());
  }
}

console.log("✅ Test finished.");
