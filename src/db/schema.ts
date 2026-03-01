import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// OpenStack Projects (tenants)
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  tenantId: text("tenant_id").notNull().unique(),
  description: text("description"),
  status: text("status").notNull().default("active"), // active, suspended, deleted
  creditLimit: real("credit_limit").notNull().default(1000.0),
  currentBalance: real("current_balance").notNull().default(0.0),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Resource types (compute, storage, network, etc.)
export const resourceTypes = sqliteTable("resource_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(), // e.g. "m1.small", "volume.ssd", "floating_ip"
  category: text("category").notNull(), // compute, storage, network, database
  unit: text("unit").notNull(), // hour, GB-hour, IP-hour
  pricePerUnit: real("price_per_unit").notNull(), // USD per unit
  description: text("description"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

// Resource instances (running VMs, volumes, etc.)
export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  resourceTypeId: integer("resource_type_id").notNull().references(() => resourceTypes.id),
  instanceId: text("instance_id").notNull(), // OpenStack resource UUID
  name: text("name").notNull(),
  region: text("region").notNull().default("RegionOne"),
  status: text("status").notNull().default("active"), // active, stopped, deleted
  quantity: real("quantity").notNull().default(1.0), // e.g. GB for storage
  startedAt: integer("started_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  stoppedAt: integer("stopped_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Usage records (hourly snapshots)
export const usageRecords = sqliteTable("usage_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  resourceId: integer("resource_id").notNull().references(() => resources.id),
  periodStart: integer("period_start", { mode: "timestamp" }).notNull(),
  periodEnd: integer("period_end", { mode: "timestamp" }).notNull(),
  quantity: real("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalCost: real("total_cost").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Invoices
export const invoices = sqliteTable("invoices", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  invoiceNumber: text("invoice_number").notNull().unique(),
  periodStart: integer("period_start", { mode: "timestamp" }).notNull(),
  periodEnd: integer("period_end", { mode: "timestamp" }).notNull(),
  subtotal: real("subtotal").notNull(),
  tax: real("tax").notNull().default(0.0),
  total: real("total").notNull(),
  status: text("status").notNull().default("pending"), // pending, paid, overdue, cancelled
  dueDate: integer("due_date", { mode: "timestamp" }).notNull(),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

// Payment transactions
export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").notNull().references(() => projects.id),
  invoiceId: integer("invoice_id").references(() => invoices.id),
  amount: real("amount").notNull(),
  method: text("method").notNull(), // credit_card, bank_transfer, credit
  transactionId: text("transaction_id"),
  status: text("status").notNull().default("completed"), // completed, failed, refunded
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});
