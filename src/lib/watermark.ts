/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Applies a beautiful "billosdock" watermark on an image base64/dataURL.
 * Creates a diagonal grid of text or an elegant modern watermark badge.
 */
export function applyWatermark(
  imageDataUrl: string,
  watermarkText: string = "billosdock"
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageDataUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // Set canvas dimensions to match the image
        canvas.width = img.width;
        canvas.height = img.height;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Configure watermark style
        const minDimension = Math.min(img.width, img.height);
        const fontSize = Math.max(16, Math.floor(minDimension / 25));
        ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
        
        // 1. Draw repeating diagonal text across the image for strong protection
        ctx.save();
        ctx.fillStyle = "rgba(16, 185, 129, 0.15)"; // Soft transparent green
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // Translate to center to rotate
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate(-Math.PI / 6); // -30 degrees
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        // Draw grid
        const stepX = fontSize * 10;
        const stepY = fontSize * 6;
        for (let x = -canvas.width; x < canvas.width * 2; x += stepX) {
          for (let y = -canvas.height; y < canvas.height * 2; y += stepY) {
            ctx.fillText(watermarkText, x, y);
          }
        }
        ctx.restore();

        // 2. Draw an elegant, professional bottom watermark bar
        ctx.save();
        const barHeight = Math.max(40, Math.floor(img.height * 0.05));
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)"; // Slate-900 transparent
        ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);

        // Draw logo/text on bottom-right of the bar
        ctx.fillStyle = "#10b981"; // Emerald-500
        const barFontSize = Math.max(12, Math.floor(barHeight * 0.4));
        ctx.font = `italic 600 ${barFontSize}px "Outfit", sans-serif`;
        ctx.textAlign = "right";
        ctx.fillText(
          `Secured by ${watermarkText.toUpperCase()}`,
          canvas.width - 20,
          canvas.height - barHeight / 2 + barFontSize / 3
        );

        // Draw date/time on bottom-left of the bar
        ctx.fillStyle = "#94a3b8"; // Slate-400
        ctx.font = `${barFontSize * 0.8}px "JetBrains Mono", monospace`;
        ctx.textAlign = "left";
        const dateStr = new Date().toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
        ctx.fillText(
          `Verified: ${dateStr}`,
          20,
          canvas.height - barHeight / 2 + barFontSize * 0.8 / 3
        );

        ctx.restore();

        // Convert back to data URL (JPEG to save space and represent watermark clearly)
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(err);
    };
  });
}

/**
 * Simulated WhatsApp Share: Triggers standard Web Share API if supported, 
 * or opens a stylized modal showing share success, and triggers download with watermark.
 */
export function shareViaWhatsApp(
  billName: string,
  watermarkedDataUrl: string
): void {
  // Convert DataURL to physical Blob for sharing
  try {
    const byteString = atob(watermarkedDataUrl.split(",")[1]);
    const mimeString = watermarkedDataUrl.split(",")[0].split(":")[1].split(";")[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: mimeString });
    const file = new File([blob], `${billName.toLowerCase().replace(/\s+/g, "_")}_watermarked.jpg`, {
      type: mimeString,
    });

    // Check if navigator.share supports file sharing
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({
        files: [file],
        title: `Bill: ${billName}`,
        text: `Sharing my bill document for ${billName} secured via billosdock watermark.`,
      }).catch((err) => {
        console.warn("Share failed:", err);
        // Fallback to whatsapp link
        openWhatsAppWebFallback(billName);
      });
    } else {
      openWhatsAppWebFallback(billName);
    }
  } catch (e) {
    console.error("Failed to share file:", e);
    openWhatsAppWebFallback(billName);
  }
}

function openWhatsAppWebFallback(billName: string) {
  const text = encodeURIComponent(
    `📄 *BillosDock Sharing* \nI'm sharing my bill document *${billName}*, watermarked and secured with *billosdock*. Download the document from BillosDock!`
  );
  window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
}
