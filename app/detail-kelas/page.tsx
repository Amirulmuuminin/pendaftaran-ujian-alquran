"use client";
import { Suspense } from "react";
import DetailKelasPageContent from "./DetailKelasPageContent";

export default function DetailKelasPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading...</div>
        </div>
      }
    >
      <DetailKelasPageContent />
    </Suspense>
  );
}
