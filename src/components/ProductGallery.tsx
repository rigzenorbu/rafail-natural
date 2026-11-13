"use client";

import { useState } from "react";

export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);
  if (images.length === 0) return <div className="gallery-main" />;
  return (
    <div>
      <div className="gallery-main">
        <img src={images[active]} alt={name} />
      </div>
      {images.length > 1 && (
        <div className="thumbs">
          {images.map((url, i) => (
            <button key={url + i} className={`thumb ${i === active ? "active" : ""}`} onClick={() => setActive(i)} aria-label={`Image ${i + 1}`}>
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
