// utils/testChrono.js
const chrono = require("chrono-node");

console.log("✅ testChrono is running");

const tests = [
  "block 2-4pm tomorrow",
  "next wed 14:30 call with supplier",
  "remind me next Fri at 5pm",
  "meeting from 9 to 11 next Mon",
];

for (const sentence of tests) {
  const result = chrono.parse(sentence);
  console.log("\n---");
  console.log("Input:", sentence);
  console.log("Parsed:", result);
  if (result.length > 0) {
    console.log("Start:", result[0].start?.date());
    if (result[0].end) console.log("End:", result[0].end.date());
  }
}
