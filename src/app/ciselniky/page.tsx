import type { Metadata } from "next";
import { CiselnikyBoard } from "./ciselniky-board";

export const metadata: Metadata = {
  title: "Číselníky",
  description: "Zboží, umístění a účet. Položky číselníku si doplníte sami.",
};

export default function CiselnikyPage() {
  return <CiselnikyBoard />;
}
