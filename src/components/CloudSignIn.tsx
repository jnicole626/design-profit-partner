import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export function CloudSignIn() {
  async function signIn(provider: "google" | "lovable") {
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message || "Sign-in failed. Please try again.");
  }
  return <div className="flex flex-wrap items-center gap-3 border-b pb-4">
    <span className="text-sm text-muted-foreground">Sign in to your private cloud catalog</span>
    <Button onClick={() => signIn("google")}>Continue with Google</Button>
    <Button variant="outline" onClick={() => signIn("lovable")}>Continue with Lovable</Button>
  </div>;
}