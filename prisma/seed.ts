import { PrismaClient } from "@prisma/client";
import { AUCTION_ENDS_AT, AUCTION_STARTING_PRICE } from "../src/lib/auction-rules";

const db = new PrismaClient();

const data = [
  {
    title: "Kávovar DeLonghi",
    description: "Plně funkční kávovar s běžnými známkami používání.",
    category: "Domácnost",
    condition: "Velmi dobrý",
    sellerFirstName: "Jan",
    sellerLastName: "Novák",
    imageUrl:
      "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=900&q=80",
    startingPrice: AUCTION_STARTING_PRICE,
    currentPrice: AUCTION_STARTING_PRICE,
  },
  {
    title: "Městské kolo",
    description: "Pohodlné městské kolo, nedávno seřízené brzdy.",
    category: "Sport a hobby",
    condition: "Dobrý",
    sellerFirstName: "Eva",
    sellerLastName: "Svobodová",
    imageUrl:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80",
    startingPrice: AUCTION_STARTING_PRICE,
    currentPrice: AUCTION_STARTING_PRICE,
  },
  {
    title: "Bezdrátová sluchátka",
    description: "Sluchátka ve funkčním stavu, nabíjecí kabel součástí.",
    category: "Elektronika",
    condition: "Dobrý",
    sellerFirstName: "Petr",
    sellerLastName: "Dvořák",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
    startingPrice: AUCTION_STARTING_PRICE,
    currentPrice: AUCTION_STARTING_PRICE,
  },
];

async function main() {
  if (await db.auction.count()) return;
  for (const item of data) {
    await db.auction.create({
      data: { ...item, endsAt: AUCTION_ENDS_AT },
    });
  }
  console.log("Ukázkové aukce vloženy.");
}

main().finally(() => db.$disconnect());
