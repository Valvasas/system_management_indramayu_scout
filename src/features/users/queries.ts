import { and, asc, eq, ilike, or, type SQL } from 'drizzle-orm';
import { getDb, schema } from '@/db';
import type { Role } from '@/db/schema';

export async function listUsers(f: { q?: string; role?: Role }) {
  const db = await getDb();
  const conds: (SQL | undefined)[] = [];
  if (f.q) {
    const like = `%${f.q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
    conds.push(or(ilike(schema.users.name, like), ilike(schema.users.username, like)));
  }
  if (f.role) conds.push(eq(schema.users.role, f.role));
  return db
    .select({
      id: schema.users.id,
      username: schema.users.username,
      name: schema.users.name,
      role: schema.users.role,
      active: schema.users.active,
      lastLoginAt: schema.users.lastLoginAt,
      kwarranName: schema.kwarran.name,
      gudepName: schema.gudep.name,
    })
    .from(schema.users)
    .leftJoin(schema.kwarran, eq(schema.kwarran.id, schema.users.kwarranId))
    .leftJoin(schema.gudep, eq(schema.gudep.id, schema.users.gudepId))
    .where(and(...conds))
    .orderBy(asc(schema.users.role), asc(schema.users.name))
    .limit(500);
}

export async function getUser(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const db = await getDb();
  const [row] = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return row ?? null;
}
