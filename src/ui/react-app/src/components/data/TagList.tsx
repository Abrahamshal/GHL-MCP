import React from "react";
import type { TagListProps, TagItem } from "../../types.js";

const tagColorMap: Record<string, string> = {
  blue: "tag-pill-blue",
  green: "tag-pill-green",
  red: "tag-pill-red",
  yellow: "tag-pill-yellow",
  purple: "tag-pill-purple",
  gray: "tag-pill-gray",
  indigo: "tag-pill-indigo",
  pink: "tag-pill-pink",
};

export const TagList: React.FC<TagListProps> = ({
  tags = [],
  maxVisible,
  size = "md",
}) => {
  const visible = maxVisible ? tags.slice(0, maxVisible) : tags;
  const remaining = maxVisible ? Math.max(0, tags.length - maxVisible) : 0;
  const sizeCls = size === "sm" ? "tag-list-sm" : "tag-list-md";

  return (
    <div className={`tag-list ${sizeCls}`}>
      {visible.map((t, i) => {
        const isObj = typeof t === "object" && t !== null;
        const label = isObj ? (t as TagItem).label : (t as string);
        const color = (isObj && (t as TagItem).color) || "blue";
        const variant = (isObj && (t as TagItem).variant) || "filled";
        const colorCls = tagColorMap[color] || "tag-pill-blue";
        const variantCls = variant === "outlined" ? "tag-pill-outlined" : "";

        return (
          <span
            key={`${label}-${i}`}
            className={`tag-pill ${colorCls} ${variantCls}`.trim()}
          >
            {label}
          </span>
        );
      })}
      {remaining > 0 && (
        <span className="tag-pill tag-pill-more">+{remaining}</span>
      )}
    </div>
  );
};
