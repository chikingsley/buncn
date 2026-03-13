import type { FileCellData } from "@/types/data-grid";

export const TASK_STATUS = ["todo", "in-progress", "done", "canceled"] as const;
export const TASK_PRIORITY = ["low", "medium", "high"] as const;
export const TASK_LABEL = [
  "bug",
  "feature",
  "enhancement",
  "documentation",
] as const;

export const SKATER_STANCE = ["regular", "goofy"] as const;
export const SKATER_STYLE = [
  "street",
  "vert",
  "park",
  "freestyle",
  "all-around",
] as const;
export const SKATER_STATUS = ["amateur", "sponsored", "pro", "legend"] as const;

export interface Task {
  archived: boolean;
  code: string;
  createdAt: Date;
  estimatedHours: number;
  id: string;
  label: (typeof TASK_LABEL)[number];
  priority: (typeof TASK_PRIORITY)[number];
  status: (typeof TASK_STATUS)[number];
  title: string | null;
  updatedAt: Date | null;
}

export type NewTask = Omit<Task, "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date | null;
};

export interface Skater {
  createdAt: Date;
  email: string | null;
  id: string;
  isPro: boolean;
  media: FileCellData[] | null;
  name: string | null;
  order: number;
  stance: (typeof SKATER_STANCE)[number];
  startedSkating: Date | null;
  status: (typeof SKATER_STATUS)[number];
  style: (typeof SKATER_STYLE)[number];
  tricks: string[] | null;
  updatedAt: Date | null;
  yearsSkating: number;
}

export type NewSkater = Omit<Skater, "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date | null;
};

export const tasks = {
  label: { enumValues: [...TASK_LABEL] },
  status: { enumValues: [...TASK_STATUS] },
  priority: { enumValues: [...TASK_PRIORITY] },
} as const;

export const skaters = {
  stance: { enumValues: [...SKATER_STANCE] },
  style: { enumValues: [...SKATER_STYLE] },
  status: { enumValues: [...SKATER_STATUS] },
} as const;

export const MAIL_FOLDER = [
  "inbox",
  "drafts",
  "sent",
  "junk",
  "trash",
  "archive",
] as const;

export const MAIL_LABEL = [
  "work",
  "personal",
  "important",
  "social",
  "updates",
  "forums",
  "shopping",
  "promotions",
] as const;

export interface Mail {
  body: string;
  createdAt: Date;
  email: string;
  folder: (typeof MAIL_FOLDER)[number];
  id: string;
  labels: (typeof MAIL_LABEL)[number][];
  name: string;
  read: boolean;
  subject: string;
  updatedAt: Date | null;
}

export type NewMail = Omit<Mail, "createdAt" | "updatedAt"> & {
  createdAt?: Date;
  updatedAt?: Date | null;
};

export const mails = {
  folder: { enumValues: [...MAIL_FOLDER] },
  label: { enumValues: [...MAIL_LABEL] },
} as const;
