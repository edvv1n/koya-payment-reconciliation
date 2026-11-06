const fs = require("fs");

let total = 0;
let count = 0;

// I found inconsitent data type so here is a helper function to parse amounts (handles strings, numbers, currency symbols, and commas)
function parseAmount(amount) {
  if (typeof amount === "number") return amount;
  if (typeof amount !== "string") return 0;
  
  const cleaned = amount.replace(/[^0-9.-]+/g, "");
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? 0 : parsed;
}

// I then attempted standard JSON parsing first, with a fallback to regex extraction for truncated lines
function parseLine(line) {
  try {
    return JSON.parse(line);
  } catch (err) {
    // Attempt to salvage status and amount from truncated/malformed JSON using regex
    const statusMatch = line.match(/"status"\s*:\s*"([^"]+)"/);
    const amountMatch = line.match(/"amount"\s*:\s*("[^"]*"|[0-9.-]+)/);

    if (statusMatch) {
      const status = statusMatch[1];
      let amount = 0;
      if (amountMatch) {
        // Remove surrounding quotes if captured as a string
        amount = amountMatch[1].replace(/^"|"$/g, "");
      }
      return { status, amount, _recovered: true };
    }
    return null; // Return null if status or usable data is not found
  }
}

const lines = fs.readFileSync("payments.jsonl", "utf8").split("\n").filter((l) => l.length > 0);

for (const line of lines) {
  const event = parseLine(line);
  
  // Count successful payments, including those recovered from truncated lines
  if (event && event.status === "success") {
    total += parseAmount(event.amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(`Check failed: counted ${count} successful payments, expected ${expected}.`);
  console.log("Something in the data isn't being handled the way the README describes.");
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}