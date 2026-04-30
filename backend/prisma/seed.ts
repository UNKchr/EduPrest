import bcrypt from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULLNAME;

  if (!email || !password || !fullName) {
    throw new Error("Missing ADMIN_* environment variables");
  }

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      role: Role.ADMIN,
      password: hash,
    },
    create: {
      email,
      fullName,
      role: Role.ADMIN,
      password: hash,
    }
  });

  console.log("Admin ensured: ", email);
}
main()
  .catch((e) => {
    console.error("Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  })
