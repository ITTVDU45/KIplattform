// ============ API Keys ============
export interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: "active" | "inactive" | "revoked";
  permissions: string[];
  createdAt: string;
  lastUsedAt: string | null;
  expiresAt: string | null;
  requestCount: number;
}

// ============ Logs ============
export interface LogEntry {
  id: string;
  timestamp: string;
  apiKeyId: string;
  apiKeyName: string;
  endpoint: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  statusCode: number;
  duration: number;
  requestBody: Record<string, unknown> | null;
  responseBody: Record<string, unknown> | null;
  ip: string;
  userAgent: string;
}

// ============ Usage ============
export interface UsageStats {
  date: string;
  requests: number;
  successCount: number;
  errorCount: number;
  avgDuration: number;
}

export interface UsageByKey {
  apiKeyId: string;
  apiKeyName: string;
  requests: number;
  successRate: number;
}

export interface UsageByEndpoint {
  endpoint: string;
  requests: number;
  avgDuration: number;
}

// ============ Storage ============
export interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: string;
  uploadedBy: string;
  folderId: string | null;
  url: string;
}

export interface StorageFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

// ============ Billing ============
export interface Transaction {
  id: string;
  type: "topup" | "usage" | "refund" | "bonus";
  amount: number;
  description: string;
  createdAt: string;
  balance: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  features: string[];
  popular?: boolean;
}

// ============ Marketplace ============
export interface MarketplaceApp {
  id: string;
  name: string;
  description: string;
  descriptionKey?: string; // i18n key for translation
  longDescription: string;
  category: string;
  categoryKey?: string; // i18n key for category translation
  price: number;
  priceType: "free" | "paid" | "subscription";
  rating: number;
  reviews: number;
  installed: boolean;
  icon: string;
  screenshots: string[];
  developer: string;
  version: string;
  updatedAt: string;
}

// ============ Integrations ============
export interface Integration {
  id: string;
  name: string;
  type: string;
  status: "active" | "inactive" | "error";
  apiKeyId: string | null;
  config: Record<string, unknown>;
  createdAt: string;
  lastSyncAt: string | null;
  icon: string;
}

// ============ Workflows ============
export interface WorkflowNode {
  id: string;
  type: "trigger" | "action" | "condition" | "ai";
  name: string;
  nameKey?: string; // i18n key for translation
  position: { x: number; y: number };
  config: Record<string, unknown>;
}

export interface WorkflowConnection {
  id: string;
  from: string;
  to: string;
}

export interface Workflow {
  id: string;
  name: string;
  nameKey?: string; // i18n key for translation
  description: string;
  descriptionKey?: string; // i18n key for translation
  status: "active" | "inactive" | "draft";
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  runCount: number;
}

// ============ Support ============
export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  category: string;
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
}

export interface TicketMessage {
  id: string;
  content: string;
  sender: "user" | "support";
  createdAt: string;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  views: number;
  helpful: number;
  createdAt: string;
}

// ============ Notifications ============
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  read: boolean;
  createdAt: string;
  link?: string;
}

// ============ Settings ============
export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret: string;
  createdAt: string;
  lastTriggeredAt: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  company: string;
  timezone: string;
  language: string;
  avatarUrl: string | null;
  // Extended profile fields
  firstName: string;
  lastName: string;
  phone: string;
  jobTitle: string;
  department: string;
  location: string;
  bio: string;
  website: string;
  linkedIn: string;
  twitter: string;
  github: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

// ============ Wishlist ============
export interface FeatureRequest {
  id: string;
  title: string;
  titleKey?: string; // i18n key for translation
  description: string;
  descriptionKey?: string; // i18n key for translation
  category: string;
  status: "pending" | "planned" | "in_progress" | "completed" | "rejected";
  votes: number;
  voted: boolean;
  authorId: string;
  authorName: string;
  createdAt: string;
  comments: number;
}
