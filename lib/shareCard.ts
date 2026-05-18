import { WordItem } from "@/app/api/analyze/route";

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export async function generateShareCard(
  imageUrl: string,
  words: WordItem[]
): Promise<Blob> {
  const img = new Image();
  img.src = imageUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });

  const FOOTER = 64;
  const SCALE = Math.min(1, 1200 / img.naturalWidth); // cap at 1200px wide
  const W = Math.round(img.naturalWidth * SCALE);
  const H = Math.round(img.naturalHeight * SCALE);

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H + FOOTER;
  const ctx = canvas.getContext("2d")!;

  // Image
  ctx.drawImage(img, 0, 0, W, H);

  // Word pills
  const FONT_SIZE = Math.max(14, W * 0.03);
  ctx.font = `bold ${FONT_SIZE}px -apple-system, sans-serif`;

  for (const word of words) {
    const cx = (word.x / 100) * W;
    const cy = (word.y / 100) * H;
    const text = word.word;
    const tw = ctx.measureText(text).width;
    const ph = FONT_SIZE * 1.8;
    const pw = tw + FONT_SIZE * 1.6;
    const px = cx - pw / 2;
    const py = cy - ph / 2;
    const radius = ph / 2;

    // Gradient fill
    const grad = ctx.createLinearGradient(px, 0, px + pw, 0);
    grad.addColorStop(0, "#3b82f6");
    grad.addColorStop(1, "#6366f1");

    // Shadow
    ctx.shadowColor = "rgba(99,102,241,0.5)";
    ctx.shadowBlur = 10;

    roundRect(ctx, px, py, pw, ph, radius);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowBlur = 0;

    // White border
    ctx.strokeStyle = "rgba(255,255,255,0.85)";
    ctx.lineWidth = 2;
    roundRect(ctx, px, py, pw, ph, radius);
    ctx.stroke();

    // Text
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, cx, cy);
  }

  // Footer gradient bar
  const footerGrad = ctx.createLinearGradient(0, 0, W, 0);
  footerGrad.addColorStop(0, "#3b82f6");
  footerGrad.addColorStop(1, "#6366f1");
  ctx.fillStyle = footerGrad;
  ctx.fillRect(0, H, W, FOOTER);

  // Branding
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.max(16, W * 0.035)}px -apple-system, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("📸 PhotoWords · Learn English from life", W / 2, H + FOOTER / 2);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas export failed"))),
      "image/jpeg",
      0.92
    );
  });
}

export async function shareOrDownload(blob: Blob) {
  const file = new File([blob], "photowords.jpg", { type: "image/jpeg" });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: "Learn English with PhotoWords",
    });
  } else {
    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "photowords.jpg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
