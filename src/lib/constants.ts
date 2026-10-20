export const APP_NAME = "MyExpense";
export const CURRENCY_SYMBOL = "₹";
export const CURRENCY_CODE = "INR";

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Food & Dining", color: "#f97316", icon: "Utensils", type: "EXPENSE" as const },
  { name: "Groceries", color: "#10b981", icon: "ShoppingCart", type: "EXPENSE" as const },
  { name: "Transportation", color: "#3b82f6", icon: "Car", type: "EXPENSE" as const },
  { name: "Housing & Rent", color: "#8b5cf6", icon: "Home", type: "EXPENSE" as const },
  { name: "Utilities & Bills", color: "#eab308", icon: "Zap", type: "EXPENSE" as const },
  { name: "Entertainment", color: "#ec4899", icon: "Film", type: "EXPENSE" as const },
  { name: "Healthcare", color: "#ef4444", icon: "HeartPulse", type: "EXPENSE" as const },
  { name: "Shopping", color: "#14b8a6", icon: "ShoppingBag", type: "EXPENSE" as const },
  { name: "Miscellaneous", color: "#6b7280", icon: "Tag", type: "EXPENSE" as const },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Salary", color: "#22c55e", icon: "Briefcase", type: "INCOME" as const },
  { name: "Freelance", color: "#06b6d4", icon: "Laptop", type: "INCOME" as const },
  { name: "Investments", color: "#84cc16", icon: "TrendingUp", type: "INCOME" as const },
  { name: "Gifts & Grants", color: "#a855f7", icon: "Gift", type: "INCOME" as const },
  { name: "Other Income", color: "#64748b", icon: "Coins", type: "INCOME" as const },
];
