import { CiselnikyApp } from "./ciselniky-board";
import { isCiselnikySession } from "@/lib/ciselniky-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const signedIn = await isCiselnikySession();
  return <CiselnikyApp signedIn={signedIn} />;
}
