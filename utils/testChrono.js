// utils/testChrono.js

import chrono from "chrono-node";

const inputTexts = [
  "block 2-4pm tomorrow — Deep Work thesis",
  "Meeting with supplier tomorrow 3pm",
  "Work on marketing 9-11am Friday",
  "Lunch with client next Wednesday at noon"
];

for (const text of inputTexts) {
  const results = chrono.parse(text);
  if (!results.length) {
    console.log(`❌ Failed to parse: "${text}"`);
    continue;
  }

  const result = results[0];
  const start = result.start?.date();
  const end = result.end?.date();
  console.log(`✅ "${text}"`);
  console.log(`   Start: ${start?.toISOString()}`);
  console.log(`   End:   ${end?.toISOString() || new Date(start.getTime() + 3600000).toISOString()}`);
  console.log("---");
}
