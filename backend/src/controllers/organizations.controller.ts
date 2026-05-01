import { Request, Response } from "express";
import { z } from "zod";
import { createOrganization, listOrganizations, banOrganization, unbanOrganization } from "../services/organizations.service";

const createSchema = z.object({
  name: z.string().min(3),
  nit: z.string().min(3)
});

const banSchema = z.object({
  reason: z.string().min(5)
});

export const createOrg = async (req: Request, res: Response) => {
  const data = createSchema.parse(req.body);
  const org = await createOrganization(data.name, data.nit);
  res.status(201).json(org);
};

export const listOrgs = async (_req: Request, res: Response) => {
  const orgs = await listOrganizations();
  res.json(orgs);
};

export const banOrg = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { reason } = banSchema.parse(req.body);
  const org = await banOrganization(id, reason);
  res.json(org);
};

export const unbanOrg = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const org = await unbanOrganization(id);
  res.json(org);
};