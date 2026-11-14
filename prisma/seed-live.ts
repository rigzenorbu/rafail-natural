// Prepares a database with the real catalogue (the live server also does this by itself on start).
//   npm run db:seed-live
import { bootstrap } from "../src/lib/bootstrap";
import { prisma } from "../src/lib/db";

bootstrap()
  .then(() => console.log("Live catalogue ready."))
  .finally(() => prisma.$disconnect());
