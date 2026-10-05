import { and, count, desc, eq, isNull, type SQL } from 'drizzle-orm';

import { getDb } from '../client';
import { feedback } from '../schema';

// Consultas de feedback de usuarios (Fase 18). Soft delete por defecto: todo listado
// filtra `deleted_at IS NULL`. La paginacion, los filtros, el orden y el total se
// resuelven en la sentencia de la base de datos.

export const FEEDBACK_TYPES = ['sugerencia', 'error', 'contenido', 'otro'] as const;
export const FEEDBACK_STATUSES = ['nuevo', 'leido', 'respondido', 'archivado'] as const;

export type FeedbackType = (typeof FEEDBACK_TYPES)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const DEFAULT_FEEDBACK_PAGE_SIZE = 20;
export const MAX_FEEDBACK_PAGE_SIZE = 100;

export interface CreateFeedbackInput {
  type: FeedbackType;
  name?: string | null;
  email?: string | null;
  message: string;
  page?: string | null;
  locale?: string | null;
  userAgent?: string | null;
}

export interface FeedbackItem {
  id: number;
  type: string;
  name: string | null;
  email: string | null;
  message: string;
  page: string | null;
  locale: string | null;
  userAgent: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListFeedbackParams {
  status?: FeedbackStatus;
  type?: FeedbackType;
  page?: number;
  pageSize?: number;
}

export interface PaginatedFeedback {
  items: FeedbackItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function createFeedback(
  input: CreateFeedbackInput,
): Promise<{ id: number; createdAt: Date }> {
  const rows = await getDb()
    .insert(feedback)
    .values({
      type: input.type,
      name: input.name ?? null,
      email: input.email ?? null,
      message: input.message,
      page: input.page ?? null,
      locale: input.locale ?? null,
      userAgent: input.userAgent ?? null,
    })
    .returning({ id: feedback.id, createdAt: feedback.createdAt });

  const row = rows[0];
  if (!row) {
    throw new Error('No se pudo crear el feedback');
  }
  return row;
}

export async function listFeedback(params: ListFeedbackParams): Promise<PaginatedFeedback> {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_FEEDBACK_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_FEEDBACK_PAGE_SIZE),
  );

  const filters: SQL[] = [isNull(feedback.deletedAt)];
  if (params.status) {
    filters.push(eq(feedback.status, params.status));
  }
  if (params.type) {
    filters.push(eq(feedback.type, params.type));
  }
  const where = and(...filters);

  const [countRow] = await db.select({ value: count() }).from(feedback).where(where);
  const total = countRow?.value ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const items = await db
    .select({
      id: feedback.id,
      type: feedback.type,
      name: feedback.name,
      email: feedback.email,
      message: feedback.message,
      page: feedback.page,
      locale: feedback.locale,
      userAgent: feedback.userAgent,
      status: feedback.status,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt,
    })
    .from(feedback)
    .where(where)
    .orderBy(desc(feedback.createdAt), desc(feedback.id))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export async function updateFeedbackStatus(id: number, status: FeedbackStatus): Promise<boolean> {
  const rows = await getDb()
    .update(feedback)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(feedback.id, id), isNull(feedback.deletedAt)))
    .returning({ id: feedback.id });
  return rows.length > 0;
}

export async function softDeleteFeedback(id: number): Promise<boolean> {
  const rows = await getDb()
    .update(feedback)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(feedback.id, id), isNull(feedback.deletedAt)))
    .returning({ id: feedback.id });
  return rows.length > 0;
}
