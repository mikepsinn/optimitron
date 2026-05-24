"use client";

import { QRCodeSVG } from "qrcode.react";

export function CampaignQrCode({
  className = "h-auto w-full max-w-full",
  value,
  size = 600,
}: {
  className?: string;
  value: string;
  size?: number;
}) {
  return (
    <QRCodeSVG
      bgColor="#ffffff"
      fgColor="#000000"
      includeMargin={false}
      level="H"
      className={className}
      size={size}
      value={value}
    />
  );
}
