import bcrypt from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const fullName = process.env.ADMIN_FULLNAME;
  const orgName = process.env.ADMIN_ORG_NAME || "Default Org";
  const orgNit = process.env.ADMIN_ORG_NIT || "DEFAULT-NIT";

  if (!email || !password || !fullName) {
    throw new Error("Missing ADMIN_* environment variables");
  }

  const organization = await prisma.organization.upsert({
    where: { nit: orgNit },
    update: { name: orgName },
    create: { name: orgName, nit: orgNit }
  });

  const hash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: {
      email_organizationId: {
        email,
        organizationId: organization.id
      }
    },
    update: {
      fullName,
      role: Role.ADMIN,
      password: hash,
      organizationId: organization.id
    },
    create: {
      email,
      fullName,
      role: Role.ADMIN,
      password: hash,
      organizationId: organization.id
    }
  });

  console.log("Admin ensured: ", email, "org:", orgNit);
}

main()
  .catch((e) => {
    console.error("Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });