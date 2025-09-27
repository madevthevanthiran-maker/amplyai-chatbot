// /utils/testChrono.js
import chrono from "chrono-node";

const inputs = [
  "block 2-4pm tomorrow — Deep Work thesis",
  "Meeting with supplier tomorrow 3pm",
  "focus from 9am to 11am on Monday",
  "remind me at 10am",
  "schedule lunch Friday 1pm",
];

inputs.forEach((input) => {
  const results = chrono.parse(input);
  console.log(`\n--- INPUT: "${input}" ---`);
  if (!results.length) {
    console.log("❌ No date parsed.");
  } else {
    results.forEach((r, i) => {
      console.log(`✅ Match ${i + 1}:`);
      console.log(`- Text: ${r.text}`);
      console.log(`- Start: ${r.start?.date().toString()}`);
      if (r.end) console.log(`- End: ${r.end.date().toString()}`);
    });
  }
});
