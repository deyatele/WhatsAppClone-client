"use client";

import Image from "next/image";
import { useState } from "react";
import type { User } from "../../types";

interface UserAvatarProps {
  user?: Pick<User, "avatar" | "name"> | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const UserAvatar = ({
  user,
  size = "md",
  className = "",
}: UserAvatarProps) => {
  const sizeClasses = {
    sm: "size-8",
    md: "size-14",
    lg: "size-20",
  };

  const textClasses = {
    sm: "text-base",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const [imageError, setImageError] = useState(false);

  return (
    <div
      className={`${sizeClasses[size]} overflow-hidden flex justify-center items-center rounded-full bg-gray-700 ${className}`}
    >
      {user?.avatar && !imageError ? (
        <Image
          src={user.avatar}
          alt={user?.name ?? "Avatar"}
          width={size === "sm" ? 32 : size === "md" ? 56 : 80}
          height={size === "sm" ? 32 : size === "md" ? 56 : 80}
          className="object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <span className={textClasses[size]}>
          {user?.name?.at(0)?.toUpperCase() ?? "U"}
        </span>
      )}
    </div>
  );
};
