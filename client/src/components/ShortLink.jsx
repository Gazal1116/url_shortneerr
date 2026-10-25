/** Full short URL display, e.g. http://localhost:5000/s/docs-brief */
export default function ShortLink({ url, className = '' }) {
  if (!url?.shortUrl) return null;

  return (
    <a
      href={url.shortUrl}
      target="_blank"
      rel="noreferrer"
      className={`inline-block max-w-full truncate font-mono text-sm text-sea hover:underline ${className}`}
    >
      {url.shortUrl}
    </a>
  );
}
