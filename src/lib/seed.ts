import { db } from "@/db";
import { projects, resourceTypes, resources, usageRecords, invoices, payments } from "@/db/schema";

export async function seedDatabase() {
  // Check if already seeded
  const existingProjects = await db.select().from(projects);
  if (existingProjects.length > 0) return;

  // Seed resource types
  await db.insert(resourceTypes).values([
    { name: "m1.tiny", category: "compute", unit: "hour", pricePerUnit: 0.01, description: "1 vCPU, 512MB RAM" },
    { name: "m1.small", category: "compute", unit: "hour", pricePerUnit: 0.04, description: "1 vCPU, 2GB RAM" },
    { name: "m1.medium", category: "compute", unit: "hour", pricePerUnit: 0.08, description: "2 vCPU, 4GB RAM" },
    { name: "m1.large", category: "compute", unit: "hour", pricePerUnit: 0.16, description: "4 vCPU, 8GB RAM" },
    { name: "m1.xlarge", category: "compute", unit: "hour", pricePerUnit: 0.32, description: "8 vCPU, 16GB RAM" },
    { name: "volume.ssd", category: "storage", unit: "GB-hour", pricePerUnit: 0.0001, description: "SSD Block Storage" },
    { name: "volume.hdd", category: "storage", unit: "GB-hour", pricePerUnit: 0.00005, description: "HDD Block Storage" },
    { name: "object.storage", category: "storage", unit: "GB-hour", pricePerUnit: 0.00003, description: "Object Storage (Swift)" },
    { name: "floating_ip", category: "network", unit: "hour", pricePerUnit: 0.005, description: "Floating IP Address" },
    { name: "load_balancer", category: "network", unit: "hour", pricePerUnit: 0.025, description: "Load Balancer" },
    { name: "bandwidth.egress", category: "network", unit: "GB", pricePerUnit: 0.09, description: "Outbound Bandwidth" },
  ]);

  // Seed projects
  const now = new Date();
  const projectData = await db.insert(projects).values([
    { name: "Production Environment", tenantId: "tenant-prod-001", description: "Main production workloads", creditLimit: 5000, currentBalance: 1234.56 },
    { name: "Development Team", tenantId: "tenant-dev-002", description: "Development and testing", creditLimit: 2000, currentBalance: 456.78 },
    { name: "Data Analytics", tenantId: "tenant-data-003", description: "Big data processing cluster", creditLimit: 10000, currentBalance: 3456.90 },
    { name: "QA Environment", tenantId: "tenant-qa-004", description: "Quality assurance testing", creditLimit: 1000, currentBalance: 123.45, status: "active" },
  ]).returning();

  // Seed resources for project 1
  const resourceTypeList = await db.select().from(resourceTypes);
  const computeSmall = resourceTypeList.find(r => r.name === "m1.small")!;
  const computeLarge = resourceTypeList.find(r => r.name === "m1.large")!;
  const computeMedium = resourceTypeList.find(r => r.name === "m1.medium")!;
  const volumeSsd = resourceTypeList.find(r => r.name === "volume.ssd")!;
  const floatingIp = resourceTypeList.find(r => r.name === "floating_ip")!;
  const loadBalancer = resourceTypeList.find(r => r.name === "load_balancer")!;

  const proj1 = projectData[0];
  const proj2 = projectData[1];
  const proj3 = projectData[2];

  const startDate1 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate2 = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

  await db.insert(resources).values([
    { projectId: proj1.id, resourceTypeId: computeLarge.id, instanceId: "inst-aaa-001", name: "web-server-01", region: "RegionOne", quantity: 1, startedAt: startDate1 },
    { projectId: proj1.id, resourceTypeId: computeLarge.id, instanceId: "inst-aaa-002", name: "web-server-02", region: "RegionOne", quantity: 1, startedAt: startDate1 },
    { projectId: proj1.id, resourceTypeId: computeMedium.id, instanceId: "inst-aaa-003", name: "db-primary", region: "RegionOne", quantity: 1, startedAt: startDate1 },
    { projectId: proj1.id, resourceTypeId: volumeSsd.id, instanceId: "vol-aaa-001", name: "db-data-volume", region: "RegionOne", quantity: 500, startedAt: startDate1 },
    { projectId: proj1.id, resourceTypeId: floatingIp.id, instanceId: "fip-aaa-001", name: "web-floating-ip", region: "RegionOne", quantity: 1, startedAt: startDate1 },
    { projectId: proj1.id, resourceTypeId: loadBalancer.id, instanceId: "lb-aaa-001", name: "prod-load-balancer", region: "RegionOne", quantity: 1, startedAt: startDate1 },
    { projectId: proj2.id, resourceTypeId: computeSmall.id, instanceId: "inst-bbb-001", name: "dev-server-01", region: "RegionOne", quantity: 1, startedAt: startDate2 },
    { projectId: proj2.id, resourceTypeId: computeSmall.id, instanceId: "inst-bbb-002", name: "dev-server-02", region: "RegionOne", quantity: 1, startedAt: startDate2 },
    { projectId: proj2.id, resourceTypeId: volumeSsd.id, instanceId: "vol-bbb-001", name: "dev-storage", region: "RegionOne", quantity: 100, startedAt: startDate2 },
    { projectId: proj3.id, resourceTypeId: computeLarge.id, instanceId: "inst-ccc-001", name: "spark-master", region: "RegionOne", quantity: 1, startedAt: startDate1 },
    { projectId: proj3.id, resourceTypeId: computeLarge.id, instanceId: "inst-ccc-002", name: "spark-worker-01", region: "RegionOne", quantity: 1, startedAt: startDate1 },
    { projectId: proj3.id, resourceTypeId: computeLarge.id, instanceId: "inst-ccc-003", name: "spark-worker-02", region: "RegionOne", quantity: 1, startedAt: startDate1 },
  ]);

  // Seed invoices
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
  const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  const twoMonthsAgoEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0);

  const invoiceData = await db.insert(invoices).values([
    {
      projectId: proj1.id,
      invoiceNumber: "INV-2024-001",
      periodStart: twoMonthsAgo,
      periodEnd: twoMonthsAgoEnd,
      subtotal: 892.40,
      tax: 89.24,
      total: 981.64,
      status: "paid",
      dueDate: new Date(twoMonthsAgoEnd.getTime() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(twoMonthsAgoEnd.getTime() + 15 * 24 * 60 * 60 * 1000),
    },
    {
      projectId: proj1.id,
      invoiceNumber: "INV-2024-002",
      periodStart: lastMonth,
      periodEnd: lastMonthEnd,
      subtotal: 1023.80,
      tax: 102.38,
      total: 1126.18,
      status: "paid",
      dueDate: new Date(lastMonthEnd.getTime() + 30 * 24 * 60 * 60 * 1000),
      paidAt: new Date(lastMonthEnd.getTime() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      projectId: proj2.id,
      invoiceNumber: "INV-2024-003",
      periodStart: lastMonth,
      periodEnd: lastMonthEnd,
      subtotal: 234.56,
      tax: 23.46,
      total: 258.02,
      status: "pending",
      dueDate: new Date(lastMonthEnd.getTime() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      projectId: proj3.id,
      invoiceNumber: "INV-2024-004",
      periodStart: lastMonth,
      periodEnd: lastMonthEnd,
      subtotal: 3120.45,
      tax: 312.05,
      total: 3432.50,
      status: "overdue",
      dueDate: new Date(lastMonthEnd.getTime() + 15 * 24 * 60 * 60 * 1000),
    },
  ]).returning();

  // Seed payments
  await db.insert(payments).values([
    { projectId: proj1.id, invoiceId: invoiceData[0].id, amount: 981.64, method: "credit_card", transactionId: "txn-001", status: "completed" },
    { projectId: proj1.id, invoiceId: invoiceData[1].id, amount: 1126.18, method: "bank_transfer", transactionId: "txn-002", status: "completed" },
  ]);
}
