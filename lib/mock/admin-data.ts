export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "user" | "admin" | "superadmin";
  status: "active" | "inactive" | "pending";
  registeredAt: string;
  lastLogin: string;
  apiKeys: {
    total: number;
    active: number;
    inactive: number;
    revoked: number;
    keys: { id: string; name: string; status: "active" | "inactive" | "revoked"; createdAt: string; lastUsed: string }[];
  };
  tokens: {
    usedTotal: number;
    usedThisMonth: number;
    limit: number;
  };
  applications: { id: string; name: string; category: string; connectedAt: string }[];
  servers: { id: string; name: string; region: string; status: "running" | "stopped" | "maintenance" }[];
}

export const mockAdminUsers: AdminUser[] = [
  {
    id: "usr-001",
    firstName: "Anna",
    lastName: "Becker",
    email: "anna.becker@example.com",
    role: "user",
    status: "active",
    registeredAt: "2024-01-10",
    lastLogin: "2026-04-17",
    apiKeys: {
      total: 4,
      active: 3,
      inactive: 1,
      revoked: 0,
      keys: [
        { id: "key-001", name: "Produktions-Key", status: "active", createdAt: "2024-01-15", lastUsed: "2026-04-17" },
        { id: "key-002", name: "Entwicklungs-Key", status: "active", createdAt: "2024-02-01", lastUsed: "2026-04-15" },
        { id: "key-003", name: "Test-Key", status: "active", createdAt: "2024-03-10", lastUsed: "2026-04-10" },
        { id: "key-004", name: "Alter Key", status: "inactive", createdAt: "2024-01-20", lastUsed: "2025-12-01" },
      ],
    },
    tokens: { usedTotal: 1250000, usedThisMonth: 84500, limit: 2000000 },
    applications: [
      { id: "app-001", name: "GPT-4 Connector", category: "Sprachmodell", connectedAt: "2024-01-20" },
      { id: "app-002", name: "Document AI", category: "Dokumentenanalyse", connectedAt: "2024-02-05" },
      { id: "app-003", name: "Image Generator", category: "Bildgenerierung", connectedAt: "2024-03-15" },
    ],
    servers: [
      { id: "srv-001", name: "eu-west-prod", region: "EU West", status: "running" },
      { id: "srv-002", name: "eu-central-dev", region: "EU Mitte", status: "running" },
    ],
  },
  {
    id: "usr-002",
    firstName: "Thomas",
    lastName: "Wagner",
    email: "thomas.wagner@firma.de",
    role: "user",
    status: "active",
    registeredAt: "2024-02-14",
    lastLogin: "2026-04-16",
    apiKeys: {
      total: 7,
      active: 5,
      inactive: 1,
      revoked: 1,
      keys: [
        { id: "key-005", name: "Main API Key", status: "active", createdAt: "2024-02-20", lastUsed: "2026-04-16" },
        { id: "key-006", name: "Analytics Key", status: "active", createdAt: "2024-03-01", lastUsed: "2026-04-14" },
        { id: "key-007", name: "CI/CD Key", status: "active", createdAt: "2024-04-10", lastUsed: "2026-04-17" },
        { id: "key-008", name: "Staging Key", status: "active", createdAt: "2024-05-05", lastUsed: "2026-04-12" },
        { id: "key-009", name: "Backup Key", status: "active", createdAt: "2024-06-01", lastUsed: "2026-04-11" },
        { id: "key-010", name: "Alter Dev Key", status: "inactive", createdAt: "2024-02-22", lastUsed: "2025-11-20" },
        { id: "key-011", name: "Kompromittiert", status: "revoked", createdAt: "2024-03-05", lastUsed: "2025-10-01" },
      ],
    },
    tokens: { usedTotal: 3800000, usedThisMonth: 210000, limit: 5000000 },
    applications: [
      { id: "app-004", name: "Claude 3 Sonnet", category: "Sprachmodell", connectedAt: "2024-02-25" },
      { id: "app-005", name: "Data Analyzer", category: "Datenanalyse", connectedAt: "2024-03-10" },
      { id: "app-006", name: "Translation API", category: "Übersetzung", connectedAt: "2024-04-01" },
      { id: "app-007", name: "Code Assistant", category: "Entwicklung", connectedAt: "2024-05-20" },
    ],
    servers: [
      { id: "srv-003", name: "eu-west-api", region: "EU West", status: "running" },
      { id: "srv-004", name: "eu-central-api", region: "EU Mitte", status: "running" },
      { id: "srv-005", name: "eu-north-backup", region: "EU Nord", status: "maintenance" },
    ],
  },
  {
    id: "usr-003",
    firstName: "Julia",
    lastName: "Müller",
    email: "julia.mueller@startup.io",
    role: "user",
    status: "active",
    registeredAt: "2024-03-22",
    lastLogin: "2026-04-14",
    apiKeys: {
      total: 2,
      active: 2,
      inactive: 0,
      revoked: 0,
      keys: [
        { id: "key-012", name: "Prod Key", status: "active", createdAt: "2024-03-25", lastUsed: "2026-04-14" },
        { id: "key-013", name: "Dev Key", status: "active", createdAt: "2024-04-01", lastUsed: "2026-04-10" },
      ],
    },
    tokens: { usedTotal: 540000, usedThisMonth: 32000, limit: 1000000 },
    applications: [
      { id: "app-008", name: "GPT-4 Connector", category: "Sprachmodell", connectedAt: "2024-04-01" },
      { id: "app-009", name: "Chatbot Builder", category: "Chatbot", connectedAt: "2024-04-15" },
    ],
    servers: [
      { id: "srv-006", name: "eu-west-lite", region: "EU West", status: "running" },
    ],
  },
  {
    id: "usr-004",
    firstName: "Markus",
    lastName: "Hoffmann",
    email: "m.hoffmann@enterprise.com",
    role: "user",
    status: "active",
    registeredAt: "2023-11-05",
    lastLogin: "2026-04-17",
    apiKeys: {
      total: 12,
      active: 9,
      inactive: 2,
      revoked: 1,
      keys: [
        { id: "key-014", name: "Enterprise Main", status: "active", createdAt: "2023-11-10", lastUsed: "2026-04-17" },
        { id: "key-015", name: "Enterprise Backup", status: "active", createdAt: "2023-11-10", lastUsed: "2026-04-16" },
        { id: "key-016", name: "Team Alpha", status: "active", createdAt: "2023-12-01", lastUsed: "2026-04-17" },
        { id: "key-017", name: "Team Beta", status: "active", createdAt: "2023-12-01", lastUsed: "2026-04-15" },
        { id: "key-018", name: "Team Gamma", status: "active", createdAt: "2024-01-05", lastUsed: "2026-04-14" },
        { id: "key-019", name: "Analytics", status: "active", createdAt: "2024-01-10", lastUsed: "2026-04-17" },
        { id: "key-020", name: "Reporting", status: "active", createdAt: "2024-02-01", lastUsed: "2026-04-13" },
        { id: "key-021", name: "Mobile App", status: "active", createdAt: "2024-03-01", lastUsed: "2026-04-12" },
        { id: "key-022", name: "Web App", status: "active", createdAt: "2024-03-15", lastUsed: "2026-04-17" },
        { id: "key-023", name: "Legacy API", status: "inactive", createdAt: "2023-11-20", lastUsed: "2025-09-01" },
        { id: "key-024", name: "Old System", status: "inactive", createdAt: "2023-11-25", lastUsed: "2025-08-15" },
        { id: "key-025", name: "Kompromittiert", status: "revoked", createdAt: "2024-01-20", lastUsed: "2024-06-01" },
      ],
    },
    tokens: { usedTotal: 12500000, usedThisMonth: 875000, limit: 20000000 },
    applications: [
      { id: "app-010", name: "GPT-4 Connector", category: "Sprachmodell", connectedAt: "2023-11-15" },
      { id: "app-011", name: "Document AI", category: "Dokumentenanalyse", connectedAt: "2023-12-01" },
      { id: "app-012", name: "Data Analyzer", category: "Datenanalyse", connectedAt: "2024-01-05" },
      { id: "app-013", name: "Code Assistant", category: "Entwicklung", connectedAt: "2024-02-10" },
      { id: "app-014", name: "Translation API", category: "Übersetzung", connectedAt: "2024-03-01" },
      { id: "app-015", name: "Image Generator", category: "Bildgenerierung", connectedAt: "2024-04-01" },
    ],
    servers: [
      { id: "srv-007", name: "ent-eu-west-1", region: "EU West", status: "running" },
      { id: "srv-008", name: "ent-eu-west-2", region: "EU West", status: "running" },
      { id: "srv-009", name: "ent-eu-central", region: "EU Mitte", status: "running" },
      { id: "srv-010", name: "ent-eu-north", region: "EU Nord", status: "running" },
    ],
  },
  {
    id: "usr-005",
    firstName: "Sophie",
    lastName: "Schneider",
    email: "sophie.s@design-studio.de",
    role: "user",
    status: "pending",
    registeredAt: "2026-04-15",
    lastLogin: "—",
    apiKeys: { total: 0, active: 0, inactive: 0, revoked: 0, keys: [] },
    tokens: { usedTotal: 0, usedThisMonth: 0, limit: 500000 },
    applications: [],
    servers: [],
  },
  {
    id: "usr-006",
    firstName: "Kevin",
    lastName: "Braun",
    email: "k.braun@techcorp.de",
    role: "user",
    status: "inactive",
    registeredAt: "2023-08-20",
    lastLogin: "2025-12-10",
    apiKeys: {
      total: 3,
      active: 0,
      inactive: 3,
      revoked: 0,
      keys: [
        { id: "key-026", name: "Main Key", status: "inactive", createdAt: "2023-08-25", lastUsed: "2025-12-10" },
        { id: "key-027", name: "Dev Key", status: "inactive", createdAt: "2023-09-01", lastUsed: "2025-11-20" },
        { id: "key-028", name: "Test Key", status: "inactive", createdAt: "2023-10-05", lastUsed: "2025-10-15" },
      ],
    },
    tokens: { usedTotal: 280000, usedThisMonth: 0, limit: 1000000 },
    applications: [
      { id: "app-016", name: "GPT-4 Connector", category: "Sprachmodell", connectedAt: "2023-09-01" },
    ],
    servers: [],
  },
  {
    id: "usr-007",
    firstName: "Laura",
    lastName: "Fischer",
    email: "laura.fischer@medien.com",
    role: "user",
    status: "active",
    registeredAt: "2024-06-10",
    lastLogin: "2026-04-17",
    apiKeys: {
      total: 3,
      active: 3,
      inactive: 0,
      revoked: 0,
      keys: [
        { id: "key-029", name: "Prod Key", status: "active", createdAt: "2024-06-15", lastUsed: "2026-04-17" },
        { id: "key-030", name: "Content API", status: "active", createdAt: "2024-07-01", lastUsed: "2026-04-16" },
        { id: "key-031", name: "Media Key", status: "active", createdAt: "2024-08-10", lastUsed: "2026-04-17" },
      ],
    },
    tokens: { usedTotal: 920000, usedThisMonth: 65000, limit: 2000000 },
    applications: [
      { id: "app-017", name: "Content Generator", category: "Inhaltserstellung", connectedAt: "2024-06-20" },
      { id: "app-018", name: "Image Generator", category: "Bildgenerierung", connectedAt: "2024-07-05" },
      { id: "app-019", name: "Translation API", category: "Übersetzung", connectedAt: "2024-08-15" },
    ],
    servers: [
      { id: "srv-011", name: "media-eu-west", region: "EU West", status: "running" },
      { id: "srv-012", name: "media-eu-central", region: "EU Mitte", status: "stopped" },
    ],
  },
  {
    id: "usr-008",
    firstName: "Daniel",
    lastName: "Weber",
    email: "d.weber@cloudnative.io",
    role: "user",
    status: "active",
    registeredAt: "2024-08-01",
    lastLogin: "2026-04-16",
    apiKeys: {
      total: 6,
      active: 4,
      inactive: 1,
      revoked: 1,
      keys: [
        { id: "key-032", name: "Cloud Main", status: "active", createdAt: "2024-08-05", lastUsed: "2026-04-16" },
        { id: "key-033", name: "Microservice A", status: "active", createdAt: "2024-08-10", lastUsed: "2026-04-15" },
        { id: "key-034", name: "Microservice B", status: "active", createdAt: "2024-09-01", lastUsed: "2026-04-14" },
        { id: "key-035", name: "Monitoring", status: "active", createdAt: "2024-10-01", lastUsed: "2026-04-17" },
        { id: "key-036", name: "Legacy Service", status: "inactive", createdAt: "2024-08-15", lastUsed: "2025-12-20" },
        { id: "key-037", name: "Altes Projekt", status: "revoked", createdAt: "2024-09-10", lastUsed: "2025-11-01" },
      ],
    },
    tokens: { usedTotal: 2100000, usedThisMonth: 148000, limit: 5000000 },
    applications: [
      { id: "app-020", name: "Code Assistant", category: "Entwicklung", connectedAt: "2024-08-10" },
      { id: "app-021", name: "Data Analyzer", category: "Datenanalyse", connectedAt: "2024-09-01" },
      { id: "app-022", name: "GPT-4 Connector", category: "Sprachmodell", connectedAt: "2024-10-15" },
    ],
    servers: [
      { id: "srv-013", name: "cloud-eu-west-1", region: "EU West", status: "running" },
      { id: "srv-014", name: "cloud-eu-west-2", region: "EU West", status: "running" },
      { id: "srv-015", name: "cloud-eu-central", region: "EU Mitte", status: "running" },
    ],
  },
];

export function getAdminStats() {
  const totalUsers = mockAdminUsers.length;
  const activeUsers = mockAdminUsers.filter((u) => u.status === "active").length;
  const pendingUsers = mockAdminUsers.filter((u) => u.status === "pending").length;
  const inactiveUsers = mockAdminUsers.filter((u) => u.status === "inactive").length;

  const totalApiKeys = mockAdminUsers.reduce((sum, u) => sum + u.apiKeys.total, 0);
  const activeApiKeys = mockAdminUsers.reduce((sum, u) => sum + u.apiKeys.active, 0);

  const totalTokensThisMonth = mockAdminUsers.reduce(
    (sum, u) => sum + u.tokens.usedThisMonth,
    0,
  );
  const totalTokensAll = mockAdminUsers.reduce((sum, u) => sum + u.tokens.usedTotal, 0);

  const totalServers = mockAdminUsers.reduce((sum, u) => sum + u.servers.length, 0);
  const runningServers = mockAdminUsers.reduce(
    (sum, u) => sum + u.servers.filter((s) => s.status === "running").length,
    0,
  );

  const totalApplications = mockAdminUsers.reduce(
    (sum, u) => sum + u.applications.length,
    0,
  );

  return {
    totalUsers,
    activeUsers,
    pendingUsers,
    inactiveUsers,
    totalApiKeys,
    activeApiKeys,
    totalTokensThisMonth,
    totalTokensAll,
    totalServers,
    runningServers,
    totalApplications,
  };
}
