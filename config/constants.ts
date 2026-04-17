export const APP_NAME = "KI Plattform";
export const APP_DESCRIPTION = "KI-Services Dashboard";

export const ITEMS_PER_PAGE = 10;

export const DATE_FORMAT = "dd.MM.yyyy";
export const DATETIME_FORMAT = "dd.MM.yyyy HH:mm";

export const STATUS_COLORS = {
  success: "bg-green-500",
  error: "bg-red-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
  pending: "bg-gray-500",
} as const;

export const HTTP_STATUS_COLORS: Record<string, string> = {
  "2xx": "text-green-600",
  "3xx": "text-blue-600",
  "4xx": "text-yellow-600",
  "5xx": "text-red-600",
};
