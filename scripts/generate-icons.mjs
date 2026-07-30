import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const root = process.cwd();
const sourcePath = path.join(root, "public", "logo.png");

const purple = "#6E5AA7";
const cream = "#F8F5EF";

const ordinaryOutputs = [
  ["app/icon.png", 512],
  ["app/apple-icon.png", 180],
  ["public/icons/icon-192.png", 192],
  ["public/icons/icon-512.png", 512],
];

const source = await readFile(sourcePath);
const {
  data: sourcePixels,
  info: sourceInfo,
} = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

let minX = sourceInfo.width;
let minY = sourceInfo.height;
let maxX = -1;
let maxY = -1;
let alphaTotal = 0;
let weightedX = 0;
let weightedY = 0;

for (let y = 0; y < sourceInfo.height; y += 1) {
  for (let x = 0; x < sourceInfo.width; x += 1) {
    const pixelIndex = (y * sourceInfo.width + x) * 4;
    const alpha = sourcePixels[pixelIndex + 3];

    if (alpha === 0) {
      continue;
    }

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
    alphaTotal += alpha;
    weightedX += x * alpha;
    weightedY += y * alpha;
  }
}

if (maxX < minX || maxY < minY || alphaTotal === 0) {
  throw new Error("The source logo does not contain visible artwork.");
}

const sourceBounds = {
  left: minX,
  top: minY,
  width: maxX - minX + 1,
  height: maxY - minY + 1,
};

const sourceCentroid = {
  x: weightedX / alphaTotal,
  y: weightedY / alphaTotal,
};

const croppedAlpha = await sharp(source)
  .extract(sourceBounds)
  .ensureAlpha()
  .extractChannel(3)
  .png()
  .toBuffer();

function roundedBackground(size) {
  const radius = Math.round(size * 0.22);

  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <rect width="${size}" height="${size}" rx="${radius}" fill="${purple}" />
    </svg>`,
  );
}

async function markLayer(size, coverage, color) {
  const width = Math.max(1, Math.round(size * coverage));
  const scale = width / sourceBounds.width;
  const height = Math.max(1, Math.round(sourceBounds.height * scale));

  const alpha = await sharp(croppedAlpha)
    .resize(width, height, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  const mark = await sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .joinChannel(alpha)
    .png()
    .toBuffer();

  const centroidWithinBounds = {
    x: (sourceCentroid.x - sourceBounds.left) * scale,
    y: (sourceCentroid.y - sourceBounds.top) * scale,
  };

  return {
    input: mark,
    left: Math.round(size / 2 - centroidWithinBounds.x),
    top: Math.round(size / 2 - centroidWithinBounds.y),
  };
}

async function encodePng(image) {
  return image
    .toColourspace("srgb")
    .withIccProfile("srgb")
    .png({
      compressionLevel: 9,
      adaptiveFiltering: true,
      palette: false,
    })
    .toBuffer();
}

async function ordinaryIcon(size) {
  const mark = await markLayer(size, 0.74, cream);

  return encodePng(
    sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: cream,
      },
    }).composite([
      { input: roundedBackground(size), left: 0, top: 0 },
      mark,
    ]),
  );
}

async function maskableIcon(size) {
  const mark = await markLayer(size, 0.62, cream);

  return encodePng(
    sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: purple,
      },
    }).composite([mark]),
  );
}

async function badgeIcon(size) {
  const mark = await markLayer(size, 0.74, cream);

  return encodePng(
    sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: {
          r: 0,
          g: 0,
          b: 0,
          alpha: 0,
        },
      },
    }).composite([mark]),
  );
}

function createIco(entries) {
  const headerSize = 6;
  const directoryEntrySize = 16;
  const directorySize = entries.length * directoryEntrySize;
  let dataOffset = headerSize + directorySize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  const directory = Buffer.alloc(directorySize);
  const payloads = [];

  entries.forEach(({ size, png }, index) => {
    const offset = index * directoryEntrySize;

    directory.writeUInt8(size >= 256 ? 0 : size, offset);
    directory.writeUInt8(size >= 256 ? 0 : size, offset + 1);
    directory.writeUInt8(0, offset + 2);
    directory.writeUInt8(0, offset + 3);
    directory.writeUInt16LE(1, offset + 4);
    directory.writeUInt16LE(32, offset + 6);
    directory.writeUInt32LE(png.length, offset + 8);
    directory.writeUInt32LE(dataOffset, offset + 12);

    payloads.push(png);
    dataOffset += png.length;
  });

  return Buffer.concat([header, directory, ...payloads]);
}

await mkdir(path.join(root, "public", "icons"), {
  recursive: true,
});

for (const [relativePath, size] of ordinaryOutputs) {
  await writeFile(
    path.join(root, relativePath),
    await ordinaryIcon(size),
  );
}

await writeFile(
  path.join(root, "public/icons/maskable-512.png"),
  await maskableIcon(512),
);

await writeFile(
  path.join(root, "public/icons/badge-96.png"),
  await badgeIcon(96),
);

const faviconEntries = [];

for (const size of [16, 32, 48, 256]) {
  faviconEntries.push({
    size,
    png: await ordinaryIcon(size),
  });
}

await writeFile(
  path.join(root, "app/favicon.ico"),
  createIco(faviconEntries),
);

console.log(
  JSON.stringify(
    {
      source: {
        size: [sourceInfo.width, sourceInfo.height],
        bounds: sourceBounds,
        alphaWeightedCentre: sourceCentroid,
      },
      ordinaryMarkCoverage: "74%",
      maskableMarkCoverage: "62%",
      generated: [
        ...ordinaryOutputs.map(([relativePath, size]) => ({
          path: relativePath,
          size: `${size}x${size}`,
        })),
        {
          path: "public/icons/maskable-512.png",
          size: "512x512",
        },
        {
          path: "public/icons/badge-96.png",
          size: "96x96",
        },
        {
          path: "app/favicon.ico",
          sizes: faviconEntries.map(({ size }) => `${size}x${size}`),
        },
      ],
    },
    null,
    2,
  ),
);
