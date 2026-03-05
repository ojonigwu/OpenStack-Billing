import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import path from "path";

const dbPath = process.env.DB_PATH ?? path.join(process.cwd(), "data.db");

const client = createClient({
  url: `file:${dbPath}`,
});

export const db = drizzle(client, { schema });
