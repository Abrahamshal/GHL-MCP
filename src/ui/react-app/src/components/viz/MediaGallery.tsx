import React, { useState, useCallback } from 'react';
import type { MediaGalleryProps, MediaItem } from '../../types.js';

interface MediaCardProps {
  item: MediaItem;
}

const MediaCard: React.FC<MediaCardProps> = ({ item }) => {
  const [imgError, setImgError] = useState(false);
  const thumb = item.thumbnailUrl || item.url || '';
  const fname = item.title || 'Untitled';
  const ext = (item.fileType || '').toUpperCase();

  const handleImgError = useCallback(() => {
    setImgError(true);
  }, []);

  return (
    <div className="mg-card">
      <div className="mg-thumb">
        {thumb && !imgError ? (
          <img
            src={thumb}
            alt={fname}
            className="mg-img"
            onError={handleImgError}
          />
        ) : null}
        <div
          className="mg-placeholder"
          style={{ display: !thumb || imgError ? 'flex' : 'none' }}
        >
          <span className="mg-placeholder-icon">📄</span>
          {ext && <span className="mg-type-badge">{ext}</span>}
        </div>
      </div>
      <div className="mg-info">
        <div className="mg-name" title={fname}>
          {fname}
        </div>
        <div className="mg-meta">
          {item.fileSize && <span>{item.fileSize}</span>}
          {item.date && <span>{item.date}</span>}
        </div>
      </div>
    </div>
  );
};

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  items = [],
  columns = 3,
  title,
}) => {
  if (items.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🖼️</div>
        <p>No media items</p>
      </div>
    );
  }

  return (
    <div className="mg-gallery">
      {title && <div className="mg-title">{title}</div>}
      <div
        className="mg-grid"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {items.map((item: MediaItem, i: number) => (
          <MediaCard key={i} item={item} />
        ))}
      </div>
    </div>
  );
};
