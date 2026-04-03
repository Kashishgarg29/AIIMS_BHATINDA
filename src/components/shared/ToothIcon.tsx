import React from "react";

export function ToothIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path fill="currentColor" stroke="none" d="M19.33,7c-0.45-3.09-2.73-5-5.33-5c-1 0-1.8,0.28-2.5,0.76C10.8,2.28,10,2,9,2C6.4,2,4.12,3.91,3.67,7C3.12,10.74,4.5,14,5.5,17l1.5,5.5c1,0,2.5,0,2.5-1c0-1,0-3,1-4.5h3c1,1.5,1,3.5,1,4.5c0,1,1.5,1,2.5,1L18.5,17C19.5,14,20.88,10.74,19.33,7z" />
    </svg>
  );
}
