import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve(import.meta.dirname, "../..");
const inputDirectory = path.join(root, "card");
const outputDirectory = path.join(root, "server/public/cards");
const thumbnailDirectory = path.join(outputDirectory, "thumbs");

await mkdir(thumbnailDirectory, { recursive: true });
const images = (await readdir(inputDirectory)).filter((file) => /\.png$/i.test(file));

await Promise.all(images.map(async (file) => {
  const input = path.join(inputDirectory, file);
  const name = path.parse(file).name;
  await sharp(input).rotate().resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true }).webp({ quality: 78, effort: 5 }).toFile(path.join(outputDirectory, `${name}.webp`));
  await sharp(input).rotate().resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true }).webp({ quality: 68, effort: 5 }).toFile(path.join(thumbnailDirectory, `${name}.webp`));
}));

console.log(`Đã tạo ${images.length} ảnh WebP và ${images.length} thumbnail.`);
