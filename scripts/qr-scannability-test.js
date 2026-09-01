/**
 * Empirically determines the reveal % at which a progressively-masked QR
 * code (error-correction level H) becomes genuinely scannable, using a
 * real QR decoder (jsQR) rather than visual judgment.
 *
 * Approach:
 * - Generate the raw module matrix via `qrcode`'s `QRCode.create()`.
 * - Function patterns (finder, separator, timing, alignment, format/version
 *   info, dark module) are flagged `reservedBit=true` by the library and
 *   are ALWAYS rendered fully, matching the product spec ("finder pattern
 *   squares always render fully so it structurally reads as a QR from the
 *   start" — extended here to all function patterns, since a scanner can't
 *   locate/align the symbol without them either).
 * - Only the data + error-correction codeword modules (reservedBit=false)
 *   are progressively revealed. Unrevealed modules render as light (0).
 * - At each reveal %, rasterize to an RGBA buffer with a light quiet zone
 *   border and feed it to jsQR. Report the lowest % that decodes correctly.
 *
 * Run with: node scripts/qr-scannability-test.js
 */

const QRCode = require('qrcode');
const jsQR = require('jsqr');

const TEST_URL = 'https://circlepact.app/circles/8f14e45f-ceea-4b8b-8b48-1b1e2c9c4e2a/wall';
const MODULE_PX = 8; // upscale factor per module so jsQR (which expects real-ish pixel density) can resolve it
const QUIET_ZONE_MODULES = 4;

function buildMatrix() {
  const qr = QRCode.create(TEST_URL, { errorCorrectionLevel: 'H' });
  return qr.modules; // BitMatrix { size, data (Uint8Array 0/1), reservedBit (Uint8Array 0/1) }
}

/**
 * Deterministic "fill order" for the data-only modules: reveal in raster
 * (row-major) order. This mimics a real progressive reveal mechanic where
 * cells fill in as circle members log proof, rather than being randomly
 * scattered every time — reveal order should be stable, not re-shuffled.
 */
function revealOrder(matrix) {
  const order = [];
  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      const idx = row * matrix.size + col;
      if (!matrix.reservedBit[idx]) order.push(idx);
    }
  }
  return order;
}

/**
 * Seeded shuffle (mulberry32) so the "scattered" reveal order is
 * reproducible across runs instead of flaking between test invocations.
 */
function seededShuffle(array, seed) {
  const result = array.slice();
  let a = seed;
  function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function rasterize(matrix, revealedSet) {
  const quiet = QUIET_ZONE_MODULES;
  const gridSize = matrix.size + quiet * 2;
  const pxSize = gridSize * MODULE_PX;
  const rgba = new Uint8ClampedArray(pxSize * pxSize * 4);

  // Fill everything light (255) first — this covers the quiet zone.
  rgba.fill(255);

  for (let row = 0; row < matrix.size; row++) {
    for (let col = 0; col < matrix.size; col++) {
      const idx = row * matrix.size + col;
      const isFunctionPattern = !!matrix.reservedBit[idx];
      const isRevealedData = revealedSet.has(idx);
      const dark = matrix.data[idx] === 1 && (isFunctionPattern || isRevealedData);

      if (!dark) continue; // already light from the fill above

      const px0 = (col + quiet) * MODULE_PX;
      const py0 = (row + quiet) * MODULE_PX;
      for (let dy = 0; dy < MODULE_PX; dy++) {
        for (let dx = 0; dx < MODULE_PX; dx++) {
          const x = px0 + dx;
          const y = py0 + dy;
          const off = (y * pxSize + x) * 4;
          rgba[off] = 0;
          rgba[off + 1] = 0;
          rgba[off + 2] = 0;
          rgba[off + 3] = 255;
        }
      }
    }
  }

  return { rgba, width: pxSize, height: pxSize };
}

function tryDecode(matrix, revealFraction, order) {
  const revealCount = Math.round(order.length * revealFraction);
  const revealedSet = new Set(order.slice(0, revealCount));
  const { rgba, width, height } = rasterize(matrix, revealedSet);
  const result = jsQR(rgba, width, height);
  if (!result) return { decoded: false };
  return { decoded: result.data === TEST_URL, data: result.data };
}

function findThreshold(matrix, order, totalDataModules, totalModules, functionPatternModules, label) {
  let firstScannableStep = null;

  for (let step = 0; step <= 100; step += 5) {
    const fraction = step / 100;
    const { decoded } = tryDecode(matrix, fraction, order);
    const overallRevealPct = (((functionPatternModules + fraction * totalDataModules) / totalModules) * 100).toFixed(1);
    console.log(`[qr-test:${label}] data-reveal ${step}% (overall ${overallRevealPct}%) -> ${decoded ? 'SCANNABLE' : 'not scannable'}`);
    if (decoded && firstScannableStep === null) firstScannableStep = step;
  }

  if (firstScannableStep === null) {
    console.log(`\n[qr-test:${label}] Never became scannable even at 100% reveal.`);
    return null;
  }

  console.log(
    `\n[qr-test:${label}] Refining threshold between ${Math.max(0, firstScannableStep - 5)}% and ${firstScannableStep}% (data-module reveal)...`
  );
  let refinedStep = firstScannableStep;
  for (let step = Math.max(0, firstScannableStep - 5); step <= firstScannableStep; step += 1) {
    const fraction = step / 100;
    const { decoded } = tryDecode(matrix, fraction, order);
    const overallRevealPct = (((functionPatternModules + fraction * totalDataModules) / totalModules) * 100).toFixed(1);
    console.log(`[qr-test:${label}]   data-reveal ${step}% (overall ${overallRevealPct}%) -> ${decoded ? 'SCANNABLE' : 'not scannable'}`);
    if (decoded) {
      refinedStep = step;
      break;
    }
  }

  const fraction = refinedStep / 100;
  const finalOverallPct = (((functionPatternModules + fraction * totalDataModules) / totalModules) * 100).toFixed(1);
  console.log(`\n[qr-test:${label}] RESULT: first genuinely scannable at data-reveal ${refinedStep}% => overall reveal ${finalOverallPct}%\n`);
  return { refinedStep, finalOverallPct };
}

function main() {
  const matrix = buildMatrix();
  const sequentialOrder = revealOrder(matrix);
  const scatteredOrder = seededShuffle(sequentialOrder, 42);
  const totalDataModules = sequentialOrder.length;
  const totalModules = matrix.size * matrix.size;
  const functionPatternModules = totalModules - totalDataModules;

  console.log(`[qr-test] Symbol size: ${matrix.size}x${matrix.size} (${totalModules} modules)`);
  console.log(
    `[qr-test] Function-pattern modules (always fully rendered): ${functionPatternModules} (${((functionPatternModules / totalModules) * 100).toFixed(1)}% of symbol)`
  );
  console.log(`[qr-test] Data+ECC codeword modules (progressively revealed): ${totalDataModules}\n`);

  console.log('=== Sequential (raster/row-major) fill order ===');
  const sequentialResult = findThreshold(
    matrix,
    sequentialOrder,
    totalDataModules,
    totalModules,
    functionPatternModules,
    'sequential'
  );

  console.log('=== Scattered (seeded-random) fill order ===');
  const scatteredResult = findThreshold(
    matrix,
    scatteredOrder,
    totalDataModules,
    totalModules,
    functionPatternModules,
    'scattered'
  );

  console.log('=== Summary ===');
  if (sequentialResult) {
    console.log(`Sequential fill: scannable at ~${sequentialResult.finalOverallPct}% overall reveal`);
  }
  if (scatteredResult) {
    console.log(`Scattered fill:  scannable at ~${scatteredResult.finalOverallPct}% overall reveal`);
  }
}

main();
