"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ShopArtwork } from "@/data/shop";
import { useDictionary, useLang } from "@/components/site/LangProvider";
import { pick } from "@/lib/i18n";

type ShopProductGalleryProps = {
  artworks: ShopArtwork[];
};

export default function ShopProductGallery({
  artworks,
}: ShopProductGalleryProps) {
  const lang = useLang();
  const { shop: words } = useDictionary();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const closeGallery = useCallback(() => {
    dialogRef.current?.close();
    setIsOpen(false);
  }, []);

  const moveSelection = useCallback(
    (direction: -1 | 1) => {
      setSelectedIndex(
        (current) =>
          (current + direction + artworks.length) % artworks.length,
      );
    },
    [artworks.length],
  );

  useEffect(() => {
    if (!isOpen) return;

    const dialog = dialogRef.current;
    if (!dialog) return;

    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") moveSelection(-1);
      if (event.key === "ArrowRight") moveSelection(1);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, moveSelection]);

  const selected = artworks[selectedIndex];

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {artworks.map((artwork, index) => (
          <button
            key={artwork.slug}
            type="button"
            onClick={() => {
              setSelectedIndex(index);
              setIsOpen(true);
            }}
            aria-label={words.viewLarger(artwork.title)}
            className="group rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
          >
            <span className="relative block aspect-[16/10] overflow-hidden rounded-md border border-divider bg-secondary">
              <Image
                src={artwork.preview.landscape}
                alt={pick(lang, artwork.alt.landscape)}
                fill
                sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.015] motion-reduce:transition-none"
              />
              <span className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-sm transition-transform group-hover:scale-105 motion-reduce:transition-none">
                <Expand size={14} aria-hidden="true" />
              </span>
            </span>
            <span className="mt-3 flex items-start justify-between gap-4">
              <span>
                <span className="block text-[14px] font-medium text-foreground">
                  {artwork.title}
                </span>
                <span className="mt-1 block text-[12px] leading-5 text-muted">
                  {pick(lang, artwork.description)}
                </span>
              </span>
              <span className="shrink-0 rounded-full border border-divider px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.6px] text-date">
                {words.theme[artwork.theme]}
              </span>
            </span>
          </button>
        ))}
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby="wallpaper-preview-title"
        onCancel={(event) => {
          event.preventDefault();
          closeGallery();
        }}
        onClose={() => setIsOpen(false)}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeGallery();
        }}
        className="fixed inset-0 m-auto h-[calc(100%-2rem)] w-[calc(100%-2rem)] max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-[#101012] p-0 text-white shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm open:flex open:flex-col"
      >
        <div className="flex min-h-16 items-center justify-between gap-4 border-b border-white/10 px-4 sm:px-6">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.8px] text-white/45">
              {selectedIndex + 1} / {artworks.length} · {words.theme[selected.theme]}
            </p>
            <h3
              id="wallpaper-preview-title"
              className="mt-0.5 text-[15px] font-medium text-white"
            >
              {selected.title}
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeGallery}
            aria-label={words.closePreview}
            className="flex size-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(180px,260px)] lg:items-center">
          <div className="relative aspect-[16/10] overflow-hidden rounded-md border border-white/10 bg-black">
            <Image
              src={selected.preview.landscape}
              alt={pick(lang, selected.alt.landscape)}
              fill
              sizes="(max-width: 1023px) 100vw, 75vw"
              className="object-cover"
            />
          </div>
          <div className="mx-auto w-full max-w-[260px]">
            <div className="relative aspect-[9/20] overflow-hidden rounded-[1.6rem] border-[5px] border-white/15 bg-black shadow-2xl">
              <Image
                src={selected.preview.mobile}
                alt={pick(lang, selected.alt.mobile)}
                fill
                sizes="260px"
                className="object-cover"
              />
              <span
                aria-hidden="true"
                className="absolute left-1/2 top-2 h-3 w-16 -translate-x-1/2 rounded-full bg-black/70"
              />
            </div>
          </div>
        </div>

        <div className="flex min-h-16 items-center justify-between gap-4 border-t border-white/10 px-4 sm:px-6">
          <p className="hidden max-w-xl text-[12px] leading-5 text-white/50 sm:block">
            {pick(lang, selected.description)}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => moveSelection(-1)}
              aria-label={words.previousWallpaper}
              className="flex size-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => moveSelection(1)}
              aria-label={words.nextWallpaper}
              className="flex size-11 items-center justify-center rounded-full border border-white/15 text-white/70 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
