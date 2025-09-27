// lib/parseTime.js
import { parseNaturalLanguageTime } from "../utils/parseTime";

export default function parseTime(text, refDate) {
  return parseNaturalLanguageTime(text, refDate);
}
