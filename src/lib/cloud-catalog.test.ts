import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { storageReference } from "./cloud-catalog";

describe("durable cloud images", () => {
  it("persists the private bucket path rather than an expiring signed URL", () => {
    expect(storageReference("https://example.com/storage/v1/object/sign/artwork-originals/owner/image?token=temporary")).toBe("storage://artwork-originals/owner/image");
  });
  it("preserves durable mockup references", () => {
    expect(storageReference("storage://listing-mockups/owner/photo")).toBe("storage://listing-mockups/owner/photo");
  });
});