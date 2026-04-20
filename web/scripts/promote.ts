import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
(async () => {
  const email = process.argv[2] ?? "demo@autokillswitch.in";
  await p.user.update({ where: { email }, data: { role: "admin" } });
  console.log("promoted", email);
  await p.$disconnect();
})();
