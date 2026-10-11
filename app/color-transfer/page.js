import { redirect } from "next/navigation";

// Preserve the previous URL while keeping one canonical color-grade workflow.
export default function ColorTransferAliasPage() {
  redirect("/color-grade-lut");
}
