import {
  array,
  boolean,
  coerce,
  object,
  string,
  type infer as ZodInfer,
  enum as zodEnum,
} from "zod";

import { MAIL_FOLDER, MAIL_LABEL } from "@/db/schema";

export const mailSchema = object({
  id: string(),
  name: string(),
  email: string().email(),
  subject: string(),
  body: string(),
  folder: zodEnum(MAIL_FOLDER),
  read: boolean(),
  labels: array(zodEnum(MAIL_LABEL)),
  createdAt: coerce.date(),
  updatedAt: coerce.date().nullable(),
});

export const updateMailSchema = object({
  read: boolean().optional(),
  folder: zodEnum(MAIL_FOLDER).optional(),
  labels: array(zodEnum(MAIL_LABEL)).optional(),
});

export type UpdateMailSchema = ZodInfer<typeof updateMailSchema>;
