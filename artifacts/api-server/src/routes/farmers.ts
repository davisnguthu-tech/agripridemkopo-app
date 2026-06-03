import { Router, type IRouter } from "express";
import { eq, ilike, or } from "drizzle-orm";
import { db, farmersTable } from "@workspace/db";
import {
  ListFarmersQueryParams,
  ListFarmersResponse,
  CreateFarmerBody,
  GetFarmerParams,
  GetFarmerResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/farmers", async (req, res): Promise<void> => {
  const query = ListFarmersQueryParams.safeParse(req.query);
  const search = query.success && query.data.search ? query.data.search : undefined;

  const rows = search
    ? await db.select().from(farmersTable).where(
        or(
          ilike(farmersTable.name, `%${search}%`),
          ilike(farmersTable.phone, `%${search}%`),
          ilike(farmersTable.county, `%${search}%`),
        ),
      )
    : await db.select().from(farmersTable).orderBy(farmersTable.createdAt);

  res.json(ListFarmersResponse.parse(rows.map(f => ({
    ...f,
    farmSizeAcres: Number(f.farmSizeAcres),
    createdAt: f.createdAt.toISOString(),
  }))));
});

router.post("/farmers", async (req, res): Promise<void> => {
  const parsed = CreateFarmerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [farmer] = await db.insert(farmersTable).values({
    ...parsed.data,
    farmSizeAcres: String(parsed.data.farmSizeAcres),
  }).returning();

  res.status(201).json(GetFarmerResponse.parse({
    ...farmer,
    farmSizeAcres: Number(farmer.farmSizeAcres),
    createdAt: farmer.createdAt.toISOString(),
  }));
});

router.get("/farmers/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetFarmerParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [farmer] = await db.select().from(farmersTable).where(eq(farmersTable.id, params.data.id));
  if (!farmer) {
    res.status(404).json({ error: "Farmer not found" });
    return;
  }

  res.json(GetFarmerResponse.parse({
    ...farmer,
    farmSizeAcres: Number(farmer.farmSizeAcres),
    createdAt: farmer.createdAt.toISOString(),
  }));
});

export default router;
