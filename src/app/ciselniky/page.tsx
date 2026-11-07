import type { Metadata } from "next";
import { CiselnikyApp } from "./ciselniky-board";
import { isCiselnikySession } from "@/lib/ciselniky-auth";

export const metadata: Metadata = {
  title: "Číselníky",
  description: "Jaké zboží je na jakém umístění a na jakém účtu.",
};

export const dynamic = "force-dynamic";

export default async function CiselnikyPage() {
  const signedIn = await isCiselnikySession();
  return <CiselnikyApp signedIn={signedIn} />;
}
