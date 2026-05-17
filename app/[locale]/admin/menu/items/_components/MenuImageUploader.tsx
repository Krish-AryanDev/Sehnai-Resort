"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Trash2, ImagePlus } from "lucide-react";
import { uploadItemImage, removeItemImage } from "../../actions";

/**
 * Image upload card on /admin/menu/items/[id]. Auto-submits on file pick
 * (most admins won't notice a separate "Upload" button is needed). Shows
 * the current image with a Remove action below.
 *
 * The server action handles validation (MIME + size + auth); the client
 * just provides the UX.
 */

export function MenuImageUploader({
  itemId,
  currentUrl,
}: {
  itemId: string;
  currentUrl: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const uploadRef = useRef<HTMLFormElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const displayUrl = localPreview ?? currentUrl;

  function onFilePicked(file: File) {
    setLocalPreview(URL.createObjectURL(file));
    // Submit the upload form once we have a file. The form contains the
    // hidden item id; the file input is already populated.
    startTransition(() => {
      uploadRef.current?.requestSubmit();
    });
  }

  return (
    <div className="menu-image-card">
      <div className="menu-image-preview">
        {displayUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={displayUrl} alt="Menu item image" />
        ) : (
          <div className="menu-image-empty">
            <ImagePlus size={32} style={{ opacity: 0.4 }} />
            <div style={{ marginTop: 6 }}>No image yet</div>
          </div>
        )}
      </div>

      <form ref={uploadRef} action={uploadItemImage}>
        <input type="hidden" name="id" value={itemId} />
        <input
          ref={fileRef}
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: "none" }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFilePicked(f);
          }}
        />
        <div className="menu-image-row">
          <button
            type="button"
            className="admin-button admin-button--primary"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={13} />
            {pending ? "Uploading…" : currentUrl ? "Replace" : "Upload"}
          </button>
          {currentUrl && (
            <RemoveImageButton itemId={itemId} disabled={pending} />
          )}
        </div>
      </form>

      <p className="menu-image-hint">
        JPEG / PNG / WebP, up to 4&nbsp;MB. Square-ish photos look best in
        the storefront card (4:3 crop).
      </p>
    </div>
  );
}

function RemoveImageButton({
  itemId,
  disabled,
}: {
  itemId: string;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <form action={(fd) => startTransition(() => removeItemImage(fd))}>
      <input type="hidden" name="id" value={itemId} />
      <button
        type="submit"
        className="admin-button admin-button--danger"
        disabled={disabled || pending}
      >
        <Trash2 size={13} />
        {pending ? "Removing…" : "Remove"}
      </button>
    </form>
  );
}
