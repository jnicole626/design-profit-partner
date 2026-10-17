import { useEffect, useState } from "react";
import { resolveCatalogImage } from "@/lib/supabase";

export function CatalogImage({ src, alt = "", className, loading }: { src: string; alt?: string; className?: string; loading?: "eager" | "lazy" }) {
  const [resolved, setResolved] = useState(src);
  useEffect(() => {
    let active = true;
    setResolved(src.startsWith("supabase-storage:") ? "" : src);
    if (src.startsWith("supabase-storage:")) {
      resolveCatalogImage(src).then(url => { if (active) setResolved(url); }).catch(() => { if (active) setResolved(""); });
    }
    return () => { active = false; };
  }, [src]);
  if (!resolved) return null;
  return <img src={resolved} alt={alt} className={className} loading={loading} />;
}
