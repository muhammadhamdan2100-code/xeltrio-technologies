"use client";

import dynamic from "next/dynamic";

const CustomCursor = dynamic(() => import("./CustomCursor"), { ssr: false });

export function CursorLoader() {
  return <CustomCursor />;
}
