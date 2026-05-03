import bcrypt from "bcrypt";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminFullName = process.env.ADMIN_FULLNAME;
  const adminOrgName = process.env.ADMIN_ORG_NAME || "Default Org";
  const adminOrgNit = process.env.ADMIN_ORG_NIT || "DEFAULT-NIT";

  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD;
  const superAdminFullName = process.env.SUPER_ADMIN_FULLNAME;
  const superAdminOrgName = process.env.SUPER_ADMIN_ORG_NAME || "EduPrest";
  const superAdminOrgNit = process.env.SUPER_ADMIN_ORG_NIT || "EDUPREST-NIT";

  const techEmail = process.env.TECH_EMAIL || "tech@eduprest.com";
  const techPassword = process.env.TECH_PASSWORD || "Tech.Eduprest123";
  const techFullName = process.env.TECH_FULLNAME || "Tecnico EduPrest";

  const studentEmail = process.env.STUDENT_EMAIL || "student@eduprest.com";
  const studentPassword = process.env.STUDENT_PASSWORD || "Student.Eduprest123";
  const studentFullName = process.env.STUDENT_FULLNAME || "Estudiante EduPrest";

  const org2Name = process.env.ORG2_NAME;
  const org2Nit = process.env.ORG2_NIT;
  const org2AdminEmail = process.env.ORG2_ADMIN_EMAIL;
  const org2AdminPassword = process.env.ORG2_ADMIN_PASSWORD;
  const org2AdminFullName = process.env.ORG2_ADMIN_FULLNAME;
  const org2TechEmail = process.env.ORG2_TECH_EMAIL;
  const org2TechPassword = process.env.ORG2_TECH_PASSWORD;
  const org2TechFullName = process.env.ORG2_TECH_FULLNAME;
  const org2StudentEmail = process.env.ORG2_STUDENT_EMAIL;
  const org2StudentPassword = process.env.ORG2_STUDENT_PASSWORD;
  const org2StudentFullName = process.env.ORG2_STUDENT_FULLNAME;

  const required = [
    { key: "ADMIN_EMAIL", value: adminEmail },
    { key: "ADMIN_PASSWORD", value: adminPassword },
    { key: "ADMIN_FULLNAME", value: adminFullName },
    { key: "SUPER_ADMIN_EMAIL", value: superAdminEmail },
    { key: "SUPER_ADMIN_PASSWORD", value: superAdminPassword },
    { key: "SUPER_ADMIN_FULLNAME", value: superAdminFullName },
    { key: "ORG2_NAME", value: org2Name },
    { key: "ORG2_NIT", value: org2Nit },
    { key: "ORG2_ADMIN_EMAIL", value: org2AdminEmail },
    { key: "ORG2_ADMIN_PASSWORD", value: org2AdminPassword },
    { key: "ORG2_ADMIN_FULLNAME", value: org2AdminFullName },
    { key: "ORG2_TECH_EMAIL", value: org2TechEmail },
    { key: "ORG2_TECH_PASSWORD", value: org2TechPassword },
    { key: "ORG2_TECH_FULLNAME", value: org2TechFullName },
    { key: "ORG2_STUDENT_EMAIL", value: org2StudentEmail },
    { key: "ORG2_STUDENT_PASSWORD", value: org2StudentPassword },
    { key: "ORG2_STUDENT_FULLNAME", value: org2StudentFullName }
  ];

  const missing = required.filter((entry) => !entry.value).map((entry) => entry.key);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const upsertOrganization = (nit: string, name: string) =>
    prisma.organization.upsert({
      where: { nit },
      update: { name },
      create: { name, nit }
    });

  const upsertUser = async (input: {
    email: string;
    fullName: string;
    role: Role;
    password: string;
    organizationId: number;
  }) => {
    const hash = await bcrypt.hash(input.password, 12);
    return prisma.user.upsert({
      where: {
        email_organizationId: {
          email: input.email,
          organizationId: input.organizationId
        }
      },
      update: {
        fullName: input.fullName,
        role: input.role,
        password: hash,
        organizationId: input.organizationId
      },
      create: {
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        password: hash,
        organizationId: input.organizationId
      }
    });
  };

  const adminOrg = await upsertOrganization(adminOrgNit, adminOrgName);
  const superAdminOrg = await upsertOrganization(superAdminOrgNit, superAdminOrgName);
  const org2 = await upsertOrganization(org2Nit!, org2Name!);

  const superAdmin = await upsertUser({
    email: superAdminEmail!,
    fullName: superAdminFullName!,
    role: Role.SUPER_ADMIN,
    password: superAdminPassword!,
    organizationId: superAdminOrg.id
  });

  const admin = await upsertUser({
    email: adminEmail!,
    fullName: adminFullName!,
    role: Role.ADMIN,
    password: adminPassword!,
    organizationId: adminOrg.id
  });

  const tech = await upsertUser({
    email: techEmail,
    fullName: techFullName,
    role: Role.TECH,
    password: techPassword,
    organizationId: adminOrg.id
  });

  const student = await upsertUser({
    email: studentEmail,
    fullName: studentFullName,
    role: Role.STUDENT,
    password: studentPassword,
    organizationId: adminOrg.id
  });

  const org2Admin = await upsertUser({
    email: org2AdminEmail!,
    fullName: org2AdminFullName!,
    role: Role.ADMIN,
    password: org2AdminPassword!,
    organizationId: org2.id
  });

  const org2Tech = await upsertUser({
    email: org2TechEmail!,
    fullName: org2TechFullName!,
    role: Role.TECH,
    password: org2TechPassword!,
    organizationId: org2.id
  });

  const org2Student = await upsertUser({
    email: org2StudentEmail!,
    fullName: org2StudentFullName!,
    role: Role.STUDENT,
    password: org2StudentPassword!,
    organizationId: org2.id
  });

  const ensureItem = async (input: {
    name: string;
    code: string;
    description?: string;
    quantity: number;
    organizationId: number;
  }) => {
    const existing = await prisma.item.findFirst({
      where: { organizationId: input.organizationId, code: input.code }
    });
    if (existing) return existing;
    return prisma.item.create({
      data: {
        name: input.name,
        code: input.code,
        description: input.description,
        quantity: input.quantity,
        organizationId: input.organizationId
      }
    });
  };

  const laptop = await ensureItem({
    name: "Laptop Dell 5400",
    code: "LP-5400",
    description: "Laptop de pruebas",
    quantity: 3,
    organizationId: adminOrg.id
  });

  await ensureItem({
    name: "Proyector Epson X",
    code: "PJ-EPX",
    description: "Proyector para sala",
    quantity: 2,
    organizationId: adminOrg.id
  });

  await ensureItem({
    name: "Router Mikrotik",
    code: "RT-MTK",
    description: "Equipo de red",
    quantity: 4,
    organizationId: adminOrg.id
  });

  const org2Tablet = await ensureItem({
    name: "Tablet Galaxy A",
    code: "TB-GA",
    description: "Tablet para pruebas",
    quantity: 5,
    organizationId: org2.id
  });

  await ensureItem({
    name: "Impresora HP",
    code: "PR-HP",
    description: "Impresora compartida",
    quantity: 2,
    organizationId: org2.id
  });

  const existingLoan = await prisma.loan.findFirst({
    where: {
      organizationId: adminOrg.id,
      userId: student.id,
      itemId: laptop.id,
      status: "ACTIVE"
    }
  });

  if (!existingLoan) {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 7);
    await prisma.loan.create({
      data: {
        userId: student.id,
        itemId: laptop.id,
        dueAt,
        organizationId: adminOrg.id
      }
    });
  }

  const existingReport = await prisma.userReport.findFirst({
    where: {
      organizationId: adminOrg.id,
      userId: student.id,
      reportedById: tech.id,
      status: "PENDING"
    }
  });

  if (!existingReport) {
    await prisma.userReport.create({
      data: {
        userId: student.id,
        reportedById: tech.id,
        reason: "Minor damage report",
        organizationId: adminOrg.id
      }
    });
  }

  const org2Loan = await prisma.loan.findFirst({
    where: {
      organizationId: org2.id,
      userId: org2Student.id,
      itemId: org2Tablet.id,
      status: "ACTIVE"
    }
  });

  if (!org2Loan) {
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + 5);
    await prisma.loan.create({
      data: {
        userId: org2Student.id,
        itemId: org2Tablet.id,
        dueAt,
        organizationId: org2.id
      }
    });
  }

  const org2Report = await prisma.userReport.findFirst({
    where: {
      organizationId: org2.id,
      userId: org2Student.id,
      reportedById: org2Tech.id,
      status: "PENDING"
    }
  });

  if (!org2Report) {
    await prisma.userReport.create({
      data: {
        userId: org2Student.id,
        reportedById: org2Tech.id,
        reason: "Device returned with scratches",
        organizationId: org2.id
      }
    });
  }

  console.log("Seed complete", {
    superAdmin: superAdmin.email,
    admin: admin.email,
    tech: tech.email,
    student: student.email,
    organization: adminOrgNit,
    org2Admin: org2Admin.email,
    org2Tech: org2Tech.email,
    org2Student: org2Student.email,
    org2: org2Nit
  });
}

main()
  .catch((e) => {
    console.error("Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });