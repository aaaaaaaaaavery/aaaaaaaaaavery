const fs = require('fs');

const s = fs.readFileSync('recaps-manual/daily/ncaabaseball.json', 'utf8');
let depth = 0;
let inString = false;
let escaped = false;
let starts = 0;
let ends = 0;

for (let i = 0; i < s.length; i += 1) {
  const ch = s[i];

  if (inString) {
    if (escaped) {
      escaped = false;
    } else if (ch === '\\') {
      escaped = true;
    } else if (ch === '"') {
      inString = false;
    }
    continue;
  }

  if (ch === '"') {
    inString = true;
    continue;
  }

  if (ch === '{') {
    if (depth === 0) starts += 1;
    depth += 1;
  } else if (ch === '}') {
    depth -= 1;
    if (depth === 0) ends += 1;
  }
}

console.log({ starts, ends, depth, inString });
