"use client";

import type { ReactNode } from "react";
import Button, { type ButtonSize, type ButtonVariant } from "./ui/Button";

type Props = {
  serviceId?: number | null;
  promotionId?: number | null;
  staffId?: number | null;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
};

export default function BookButton({
  serviceId,
  promotionId,
  staffId,
  variant = "primary",
  size = "md",
  className,
  children,
  onClick,
}: Props) {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => {
        onClick?.();
        window.dispatchEvent(
          new CustomEvent("salon:open-booking", {
            detail: {
              serviceId: serviceId ?? null,
              promotionId: promotionId ?? null,
              staffId: staffId ?? null,
            },
          })
        );
      }}
    >
      {children}
    </Button>
  );
}