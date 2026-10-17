import { useState } from "react";
import { supabase, supabaseConfigured } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage(data.session
          ? "Account created. You're signed in."
          : "Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Couldn't sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <section className="paper w-full max-w-md rounded-2xl p-7 shadow-sm">
        <div className="mb-6 text-center">
          <div className="font-script text-2xl leading-none text-gold">the</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-[0.14em]">RAW <span className="text-coral">PALETTE</span></h1>
          <p className="mt-2 text-sm text-muted-foreground">Your private design & listing studio</p>
        </div>
        {!supabaseConfigured ? (
          <div className="space-y-3 text-sm">
            <p className="font-semibold">One setup step remains</p>
            <p>Add your Supabase Project URL and publishable key to the app's environment settings. The current app won't connect to cloud storage until those are set.</p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={submit}>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div><Label htmlFor="password">Password</Label><Input id="password" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} /></div>
            {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
            <Button type="submit" disabled={busy} className="w-full bg-coral text-ivory hover:bg-coral/90">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</Button>
            <button type="button" className="w-full text-sm text-primary underline underline-offset-4" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>
              {mode === "signin" ? "Need an account? Create one" : "Already have an account? Sign in"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
