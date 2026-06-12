"use client";

import React from "react";

export default function WhatsAppFloat() {
  const phone = "919999999999"; // Custom placeholder phone
  const message = "Hello Mehta Sweet Mart, I would like to inquire about your sweets and gift boxes.";
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-emerald-500/30"
      aria-label="Contact us on WhatsApp"
    >
      <svg
        className="h-8 w-8 fill-current"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.731-1.464L0 24zm6.59-4.846c1.6.95 3.398 1.451 5.355 1.452 5.516.002 10.007-4.486 10.01-10.006.002-2.675-1.037-5.188-2.932-7.087S14.685 1.766 12.01 1.766 6.818 6.257 6.815 11.777c-.001 2.052.535 4.05 1.554 5.795L7.382 21.05l3.633-1.016zM17.9 14.885c-.322-.16-.1.9-.387-.9-.452-.226-2.677-1.317-3.056-1.453-.38-.137-.656-.205-.93.207-.276.413-.518.657-.656.828-.137.172-.276.19-.597.03-.322-.16-1.36-.5-2.59-1.6-1-.89-1.675-2-1.87-2.33-.195-.33-.02-.508.14-.67.147-.145.32-.375.483-.563.16-.188.218-.32.32-.533.106-.21.054-.397-.02-.556-.076-.16-.656-1.58-.9-2.17-.24-.575-.48-.496-.656-.505l-.56-.008c-.19 0-.5.07-.76.353-.263.284-1.006.983-1.006 2.402 0 1.417 1.03 2.787 1.173 2.977.143.19 2.028 3.098 4.912 4.34.686.295 1.222.472 1.637.604.69.218 1.317.187 1.812.113.553-.08 1.693-.69 1.93-1.357.24-.668.24-1.24.168-1.357-.07-.116-.27-.205-.59-.365z" />
      </svg>
    </a>
  );
}
