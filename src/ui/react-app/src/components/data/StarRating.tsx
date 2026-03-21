import React from "react";
import type { StarRatingProps } from "../../types.js";

export const StarRating: React.FC<StarRatingProps> = ({
  rating = 0,
  count,
  maxStars = 5,
  distribution,
  showDistribution,
}) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = maxStars - fullStars - (hasHalf ? 1 : 0);
  const stars =
    "★".repeat(fullStars) +
    (hasHalf ? "⯨" : "") +
    "☆".repeat(Math.max(0, emptyStars));

  const maxCount = distribution
    ? Math.max(...distribution.map((d) => d.count), 1)
    : 1;

  const sorted = distribution
    ? [...distribution].sort((a, b) => b.stars - a.stars)
    : [];

  return (
    <div className="star-rating-wrap">
      <div className="star-rating-summary">
        <span className="star-rating-value">{rating.toFixed(1)}</span>
        <span className="star-rating-stars">{stars}</span>
        {count !== undefined && (
          <span className="star-rating-count">
            ({Number(count).toLocaleString()} reviews)
          </span>
        )}
      </div>
      {showDistribution && distribution && (
        <div className="star-rating-distribution">
          {sorted.map((d) => {
            const pct = (d.count / maxCount) * 100;
            return (
              <div key={d.stars} className="star-dist-row">
                <span className="star-dist-label">{d.stars}★</span>
                <div className="star-dist-track">
                  <div
                    className="star-dist-bar"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="star-dist-count">{d.count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
