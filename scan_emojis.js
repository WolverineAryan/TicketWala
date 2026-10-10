const fs = require("fs");
const path = require("path");

const emojiRegex = /\p{Extended_Pictographic}/gu;

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules" && entry.name !== ".next" && entry.name !== ".git") {
        scanDir(fullPath);
      }
    } else if (/\.(tsx|ts|jsx|js|css|html)$/.test(entry.name)) {
      const content = fs.readFileSync(fullPath, "utf8");
      const lines = content.split("\n");
      lines.forEach((line, idx) => {
        const matches = line.match(emojiRegex);
        if (matches) {
          console.log(`${fullPath}:${idx + 1}: [${matches.join(" ")}] -> ${line.trim()}`);
        }
      });
    }
  }
}

scanDir("./frontend/src");
