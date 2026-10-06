"use client";

import { useFormState } from "react-dom";
import SubmitButton from "@/components/SubmitButton";
import { aksiLogin } from "../actions";

export default function FormLogin() {
  const [state, formAction] = useFormState(aksiLogin, {});

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="alert-error">{state.error}</p>}

      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" className="input" placeholder="nama@instansi.sch.id" required autoComplete="email" />
      </div>

      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" placeholder="••••••••" required autoComplete="current-password" />
      </div>

      <SubmitButton className="btn-primary w-full" loadingText="Memeriksa…">
        Masuk
      </SubmitButton>
    </form>
  );
}
