import React from "react";
import type { AvatarGroupProps } from "../../types.js";

const avatarColors = [
  "#4f46e5",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
];

function getAvatarColor(name: string): string {
  return avatarColors[(name || "").charCodeAt(0) % avatarColors.length];
}

function getInitials(name: string): string {
  return (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const avatarSizeMap: Record<string, string> = {
  sm: "ag-sm",
  md: "ag-md",
  lg: "ag-lg",
};

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars = [],
  max = 5,
  size = "md",
}) => {
  const visible = avatars.slice(0, max);
  const overflow = avatars.length - max;
  const sizeCls = avatarSizeMap[size] || "ag-md";

  return (
    <div className={`avatar-group ${sizeCls}`}>
      {visible.map((a, i) => {
        const name = a.name || "";
        const initials = a.initials || getInitials(name);
        const color = getAvatarColor(name);

        if (a.imageUrl) {
          return (
            <div
              key={i}
              className="ag-avatar"
              style={{ zIndex: visible.length - i }}
              title={name}
            >
              <img src={a.imageUrl} alt={name} className="ag-img" />
            </div>
          );
        }

        return (
          <div
            key={i}
            className="ag-avatar"
            style={{ zIndex: visible.length - i, background: color }}
            title={name}
          >
            <span className="ag-initials">{initials}</span>
          </div>
        );
      })}
      {overflow > 0 && (
        <div className="ag-avatar ag-overflow" style={{ zIndex: 0 }}>
          <span className="ag-initials">+{overflow}</span>
        </div>
      )}
    </div>
  );
};
