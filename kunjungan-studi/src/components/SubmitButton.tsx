"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({
  children,
  className = "btn-primary",
  loadingText = "Memproses…",
  confirm,
}: {
  children: React.ReactNode;
  className?: string;
  loadingText?: string;
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {pending ? loadingText : children}
    </button>
  );
}
