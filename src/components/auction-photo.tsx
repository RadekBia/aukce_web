"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export function AuctionPhoto({
  src,
  alt,
  imgClassName,
}: {
  src: string;
  alt: string;
  imgClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="photo-open"
        onClick={() => setOpen(true)}
        aria-label={`Zvětšit fotku: ${alt}`}
      >
        <img className={imgClassName} src={src} alt={alt} />
      </button>
      {open ? (
        <PhotoLightbox src={src} alt={alt} onClose={() => setOpen(false)} />
      ) : null}
    </>
  );
}

function PhotoLightbox({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        className="lightbox-close"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
      >
        Zavřít
      </button>
      <img
        className="lightbox-photo"
        src={src}
        alt={alt}
        onClick={(event) => event.stopPropagation()}
      />
    </div>,
    document.body,
  );
}
