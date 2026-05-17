/**
 * Генерация PNG/ICO из public/icons/icon.svg (логотип FinTrackerPro).
 * Запуск: node scripts/generate-icons.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";
import toIco from "to-ico";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const publicDir = path.join(root, "public");
const svgPath = path.join(publicDir, "icons", "icon.svg");

const svg = fs.readFileSync(svgPath, "utf8");

function renderPng(size) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
  });
  return resvg.render().asPng();
}

async function writePng(buffer, filePath) {
  await sharp(buffer).png().toFile(filePath);
  console.log("wrote", path.relative(root, filePath));
}

async function main() {
  const sizes = [
    { size: 16, file: "icons/favicon-16.png" },
    { size: 32, file: "icons/favicon-32.png" },
    { size: 180, file: "apple-touch-icon.png" },
    { size: 192, file: "logo192.png" },
    { size: 512, file: "logo512.png" },
  ];

  const pngBuffers = {};
  for (const { size, file } of sizes) {
    const buf = renderPng(size);
    pngBuffers[size] = buf;
    await writePng(buf, path.join(publicDir, file));
  }

  fs.writeFileSync(path.join(publicDir, "favicon.svg"), svg);
  console.log("wrote public/favicon.svg");

  const ico = await toIco([pngBuffers[16], pngBuffers[32]]);
  fs.writeFileSync(path.join(publicDir, "favicon.ico"), ico);
  console.log("wrote public/favicon.ico");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
