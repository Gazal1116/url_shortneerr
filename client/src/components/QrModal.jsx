import { QRCodeSVG } from 'qrcode.react';

export default function QrModal({ url, onClose }) {
  if (!url) return null;

  function downloadPng() {
    const svg = document.getElementById('qr-svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 512, 512);
      ctx.drawImage(img, 0, 0, 512, 512);
      const a = document.createElement('a');
      a.download = `${url.code}-qr.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = `data:image/svg+xml;base64,${svg64}`;
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-rise w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <h3 className="text-lg font-semibold text-ink">QR code</h3>
        <p className="mt-1 truncate font-mono text-xs text-ink/50">
          {url.shortUrl}
        </p>
        <div className="mx-auto mt-5 grid w-fit place-items-center rounded-xl border border-ink/8 p-4">
          <QRCodeSVG
            id="qr-svg"
            value={url.shortUrl}
            size={200}
            level="M"
            includeMargin
          />
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={downloadPng}
            className="flex-1 rounded-lg bg-leaf py-2.5 text-sm font-semibold text-mint"
          >
            Download PNG
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-ink/10 px-4 py-2.5 text-sm text-ink/70"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
