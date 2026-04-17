import { randomDelay } from "./delay";
import * as db from "./db";
import type {
  ApiKey,
  LogEntry,
  UsageStats,
  UsageByKey,
  UsageByEndpoint,
  StorageFile,
  Transaction,
  Plan,
  MarketplaceApp,
  Integration,
  Workflow,
  Ticket,
  KnowledgeArticle,
  Notification,
  Webhook,
  UserProfile,
  FeatureRequest,
} from "@/types/domain";

// Generic response wrapper
interface ApiResponse<T> {
  data: T;
  error?: string;
}

async function mockRequest<T>(data: T): Promise<ApiResponse<T>> {
  await randomDelay(100, 300);
  return { data };
}

// ============ API Keys ============
export async function getApiKeys(): Promise<ApiResponse<ApiKey[]>> {
  return mockRequest([...db.apiKeys]);
}

export async function getApiKey(id: string): Promise<ApiResponse<ApiKey | null>> {
  const key = db.apiKeys.find((k) => k.id === id) || null;
  return mockRequest(key);
}

export async function createApiKey(data: Partial<ApiKey>): Promise<ApiResponse<ApiKey>> {
  const newKey: ApiKey = {
    id: `key_${Date.now()}`,
    name: data.name || "New API Key",
    key: `sk_live_${Math.random().toString(36).substring(2, 15)}`,
    status: "active",
    permissions: data.permissions || ["read"],
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    expiresAt: data.expiresAt || null,
    requestCount: 0,
  };
  db.apiKeys.push(newKey);
  return mockRequest(newKey);
}

export async function revokeApiKey(id: string): Promise<ApiResponse<ApiKey | null>> {
  const key = db.apiKeys.find((k) => k.id === id);
  if (key) {
    key.status = "revoked";
  }
  return mockRequest(key || null);
}

// ============ Logs ============
export async function getLogs(filters?: {
  apiKeyId?: string;
  status?: string;
  endpoint?: string;
}): Promise<ApiResponse<LogEntry[]>> {
  let result = [...db.logs];
  if (filters?.apiKeyId) {
    result = result.filter((l) => l.apiKeyId === filters.apiKeyId);
  }
  if (filters?.status) {
    const statusRange = parseInt(filters.status);
    result = result.filter(
      (l) => Math.floor(l.statusCode / 100) * 100 === statusRange
    );
  }
  if (filters?.endpoint) {
    const endpoint = filters.endpoint;
    result = result.filter((l) => l.endpoint.includes(endpoint));
  }
  return mockRequest(result);
}

export async function getLog(id: string): Promise<ApiResponse<LogEntry | null>> {
  const log = db.logs.find((l) => l.id === id) || null;
  return mockRequest(log);
}

// ============ Usage ============
export async function getUsageStats(): Promise<ApiResponse<UsageStats[]>> {
  return mockRequest([...db.usageStats]);
}

export async function getUsageByKey(): Promise<ApiResponse<UsageByKey[]>> {
  return mockRequest([...db.usageByKey]);
}

export async function getUsageByEndpoint(): Promise<ApiResponse<UsageByEndpoint[]>> {
  return mockRequest([...db.usageByEndpoint]);
}

// ============ Storage ============
export async function getStorageFiles(): Promise<ApiResponse<StorageFile[]>> {
  return mockRequest([...db.storageFiles]);
}

export async function getStorageFile(id: string): Promise<ApiResponse<StorageFile | null>> {
  const file = db.storageFiles.find((f) => f.id === id) || null;
  return mockRequest(file);
}

export async function deleteStorageFile(id: string): Promise<ApiResponse<boolean>> {
  const index = db.storageFiles.findIndex((f) => f.id === id);
  if (index > -1) {
    db.storageFiles.splice(index, 1);
    return mockRequest(true);
  }
  return mockRequest(false);
}

// ============ Billing ============
export async function getBalance(): Promise<ApiResponse<number>> {
  return mockRequest(db.currentBalance);
}

export async function getTransactions(): Promise<ApiResponse<Transaction[]>> {
  return mockRequest([...db.transactions]);
}

export async function getPlans(): Promise<ApiResponse<Plan[]>> {
  return mockRequest([...db.plans]);
}

// ============ Marketplace ============
export async function getMarketplaceApps(filters?: {
  category?: string;
  installed?: boolean;
}): Promise<ApiResponse<MarketplaceApp[]>> {
  let result = [...db.marketplaceApps];
  if (filters?.category) {
    result = result.filter((a) => a.category === filters.category);
  }
  if (filters?.installed !== undefined) {
    result = result.filter((a) => a.installed === filters.installed);
  }
  return mockRequest(result);
}

export async function getMarketplaceApp(id: string): Promise<ApiResponse<MarketplaceApp | null>> {
  const app = db.marketplaceApps.find((a) => a.id === id) || null;
  return mockRequest(app);
}

export async function installApp(id: string): Promise<ApiResponse<MarketplaceApp | null>> {
  const app = db.marketplaceApps.find((a) => a.id === id);
  if (app) {
    app.installed = true;
  }
  return mockRequest(app || null);
}

export async function uninstallApp(id: string): Promise<ApiResponse<MarketplaceApp | null>> {
  const app = db.marketplaceApps.find((a) => a.id === id);
  if (app) {
    app.installed = false;
  }
  return mockRequest(app || null);
}

// ============ Integrations ============
export async function getIntegrations(): Promise<ApiResponse<Integration[]>> {
  return mockRequest([...db.integrations]);
}

export async function getIntegration(id: string): Promise<ApiResponse<Integration | null>> {
  const integration = db.integrations.find((i) => i.id === id) || null;
  return mockRequest(integration);
}

export async function toggleIntegration(id: string): Promise<ApiResponse<Integration | null>> {
  const integration = db.integrations.find((i) => i.id === id);
  if (integration) {
    integration.status = integration.status === "active" ? "inactive" : "active";
  }
  return mockRequest(integration || null);
}

// ============ Workflows ============
export async function getWorkflows(): Promise<ApiResponse<Workflow[]>> {
  return mockRequest([...db.workflows]);
}

export async function getWorkflow(id: string): Promise<ApiResponse<Workflow | null>> {
  const workflow = db.workflows.find((w) => w.id === id) || null;
  return mockRequest(workflow);
}

export async function toggleWorkflow(id: string): Promise<ApiResponse<Workflow | null>> {
  const workflow = db.workflows.find((w) => w.id === id);
  if (workflow) {
    workflow.status = workflow.status === "active" ? "inactive" : "active";
  }
  return mockRequest(workflow || null);
}

// ============ Support ============
export async function getTickets(): Promise<ApiResponse<Ticket[]>> {
  return mockRequest([...db.tickets]);
}

export async function getTicket(id: string): Promise<ApiResponse<Ticket | null>> {
  const ticket = db.tickets.find((t) => t.id === id) || null;
  return mockRequest(ticket);
}

export async function createTicket(data: Partial<Ticket>): Promise<ApiResponse<Ticket>> {
  const newTicket: Ticket = {
    id: `ticket_${Date.now()}`,
    subject: data.subject || "Neues Ticket",
    description: data.description || "",
    status: "open",
    priority: data.priority || "medium",
    category: data.category || "Allgemein",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [],
  };
  db.tickets.push(newTicket);
  return mockRequest(newTicket);
}

export async function getKnowledgeArticles(): Promise<ApiResponse<KnowledgeArticle[]>> {
  return mockRequest([...db.knowledgeArticles]);
}

// ============ Notifications ============
export async function getNotifications(): Promise<ApiResponse<Notification[]>> {
  return mockRequest([...db.notifications]);
}

export async function markNotificationRead(id: string): Promise<ApiResponse<Notification | null>> {
  const notification = db.notifications.find((n) => n.id === id);
  if (notification) {
    notification.read = true;
  }
  return mockRequest(notification || null);
}

export async function markAllNotificationsRead(): Promise<ApiResponse<boolean>> {
  db.notifications.forEach((n) => (n.read = true));
  return mockRequest(true);
}

// ============ Settings ============
export async function getWebhooks(): Promise<ApiResponse<Webhook[]>> {
  return mockRequest([...db.webhooks]);
}

export async function toggleWebhook(id: string): Promise<ApiResponse<Webhook | null>> {
  const webhook = db.webhooks.find((w) => w.id === id);
  if (webhook) {
    webhook.active = !webhook.active;
  }
  return mockRequest(webhook || null);
}

export async function getUserProfile(): Promise<ApiResponse<UserProfile>> {
  return mockRequest({ ...db.userProfile });
}

export async function updateUserProfile(data: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> {
  Object.assign(db.userProfile, data);
  return mockRequest({ ...db.userProfile });
}

// ============ Feature Requests ============
export async function getFeatureRequests(): Promise<ApiResponse<FeatureRequest[]>> {
  return mockRequest([...db.featureRequests]);
}

export async function voteFeatureRequest(id: string): Promise<ApiResponse<FeatureRequest | null>> {
  const request = db.featureRequests.find((r) => r.id === id);
  if (request) {
    if (request.voted) {
      request.votes--;
      request.voted = false;
    } else {
      request.votes++;
      request.voted = true;
    }
  }
  return mockRequest(request || null);
}

export async function createFeatureRequest(data: Partial<FeatureRequest>): Promise<ApiResponse<FeatureRequest>> {
  const newRequest: FeatureRequest = {
    id: `fr_${Date.now()}`,
    title: data.title || "Neuer Feature-Wunsch",
    description: data.description || "",
    category: data.category || "Features",
    status: "pending",
    votes: 1,
    voted: true,
    authorId: "user_1",
    authorName: "Max Mustermann",
    createdAt: new Date().toISOString(),
    comments: 0,
  };
  db.featureRequests.push(newRequest);
  return mockRequest(newRequest);
}
