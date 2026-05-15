// Generates PWA icons from public/icons/icon.svg using sharp
// Run: node scripts/gen-icons.js
import sharp from "sharp";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const svgBuf = readFileSync(join(root, "public", "icons", "icon.svg"));

await sharp(svgBuf).resize(192, 192).png().toFile(join(root, "public", "icons", "icon-192.png"));
console.log("✅ icon-192.png");

await sharp(svgBuf).resize(512, 512).png().toFile(join(root, "public", "icons", "icon-512.png"));
console.log("✅ icon-512.png");

console.log("🎉 PWA icons generated.");
