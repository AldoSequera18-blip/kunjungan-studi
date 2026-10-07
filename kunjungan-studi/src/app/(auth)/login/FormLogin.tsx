"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { aksiLogin } from "../actions";

export default function FormLogin() {
  const [state, formAction] = useFormState(aksiLogin, {});
  const [passwordTerlihat, setPasswordTerlihat] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="alert-error">{state.error}</p>}

      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" placeholder="nama@instansi.sch.id" required autoComplete="email" />
      </div>

      <div>
        <label className="label" htmlFor="password">Password</label>
        <div className="relative">
          <input
            id="password"
            name="password"
            type={passwordTerlihat ? "text" : "password"}
            className="input pr-12"
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setPasswordTerlihat((terlihat) => !terlihat)}
            className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-500 hover:text-slate-800"
            aria-label={passwordTerlihat ? "Sembunyikan password" : "Lihat password"}
            aria-pressed={passwordTerlihat}
            title={passwordTerlihat ? "Sembunyikan password" : "Lihat password"}
          >
            {passwordTerlihat ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 5.2A10.8 10.8 0 0112 5c5 0 8.7 4.2 9.7 6.2a1.8 1.8 0 010 1.6 11.7 11.7 0 01-3.2 3.9M6.2 6.3a12 12 0 00-3.9 4.9 1.8 1.8 0 000 1.6A10.8 10.8 0 0012 19c1 0 2-.2 2.9-.5" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.3 12s3.5-7 9.7-7 9.7 7 9.7 7-3.5 7-9.7 7-9.7-7-9.7-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <SubmitButton className="btn-primary w-full" loadingText="Memeriksa…">
        Masuk
      </SubmitButton>
    </form>
  );
}
