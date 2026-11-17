/**
 * Renders a project's demo video. Accepts a YouTube/Vimeo URL (embedded via a
 * privacy-friendly iframe) or a direct .mp4 / .webm path/URL (native <video>).
 * Server component — no client JS needed.
 */

/** Extract a YouTube video id from the common URL shapes, or null. */
function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  );
  return m ? m[1] : null;
}

/** Extract a Vimeo video id, or null. */
function vimeoId(url: string): string | null {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? m[1] : null;
}

export function ProjectVideo({ src, title = "Project demo video" }: { src: string; title?: string }) {
  const yt = youtubeId(src);
  const vimeo = yt ? null : vimeoId(src);
  const embed = yt
    ? `https://www.youtube-nocookie.com/embed/${yt}`
    : vimeo
      ? `https://player.vimeo.com/video/${vimeo}`
      : null;

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-divider bg-black">
      {embed ? (
        <iframe
          src={embed}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <video src={src} controls playsInline className="absolute inset-0 h-full w-full">
          <track kind="captions" />
        </video>
      )}
    </div>
  );
}
