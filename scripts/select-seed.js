// Copies seed/personal.json (if present) or seed/personal.example.json to seed/active.json.
// lib/seed.ts imports seed/active.json. Runs after npm install and before start, web, test.
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "seed");
const personal = path.join(dir, "personal.json");
const example = path.join(dir, "personal.example.json");
const src = fs.existsSync(personal) ? personal : example;
fs.copyFileSync(src, path.join(dir, "active.json"));
console.log("seed: using " + path.basename(src));
