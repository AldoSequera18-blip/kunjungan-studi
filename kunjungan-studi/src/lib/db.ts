import "server-only";
import postgres from "postgres";

type RunResult = { changes: number; lastInsertRowid: number | bigint | undefined };

declare global {
  // eslint-disable-next-line no-var
  var __kunjunganPostgres: ReturnType<typeof postgres> | undefined;
}

function connection() {
  if (global.__kunjunganPostgres) return global.__kunjunganPostgres;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL belum diatur. Atur koneksi PostgreSQL Supabase di environment server.");
  const client = postgres(url, {
    max: Number(process.env.DB_POOL_MAX || 5),
    prepare: false,
    ssl: "require",
    connect_timeout: 15,
  });
  global.__kunjunganPostgres = client;
  return client;
}

function postgresSql(source: string) {
  let sql = source
    .replace(/datetime\('now'\)/gi, "now()")
    .replace(/date\('now',\s*'-30 days'\)/gi, "(current_date - interval '30 days')::date")
    .replace(/date\('now'\)/gi, "current_date")
    .replace(/date\(([a-zA-Z_][\w.]*)\)/g, "($1)::date");
  let index = 0;
  sql = sql.replace(/\?/g, () => `$${++index}`);
  return sql;
}

function normalizeRows(rows: any[]) {
  const columns = (rows as any).columns ?? [];
  for (const row of rows) {
    columns.forEach((column: { name: string; type: number }) => {
      const value = row[column.name];
      if (value === null || value === undefined) return;
      if ([20, 21, 23, 1700].includes(column.type)) row[column.name] = Number(value);
      else if (column.type === 1082 && value instanceof Date) row[column.name] = value.toISOString().slice(0, 10);
      else if (column.type === 1083 && value instanceof Date) row[column.name] = value.toISOString().slice(11, 19);
      else if ([1114, 1184].includes(column.type) && value instanceof Date) row[column.name] = value.toISOString();
    });
  }
  return rows;
}

/**
 * API kueri tipis yang mempertahankan bentuk pemanggilan lama agar refaktor
 * pemanggil dapat dilakukan bertahap. Seluruh hasil query bersifat async.
 * Skema dibuat melalui migration Supabase di folder supabase/migrations.
 */
export const db = {
  prepare(source: string) {
    const base = postgresSql(source);
    return {
      async get(...params: any[]): Promise<any> {
        const rows: any = normalizeRows(await connection().unsafe(base, params));
        return rows[0];
      },
      async all(...params: any[]): Promise<any[]> {
        return normalizeRows(await connection().unsafe(base, params)) as any[];
      },
      async run(...params: any[]): Promise<RunResult> {
        const isInsert = /^\s*insert\b/i.test(base);
        const hasId = !/^\s*insert\s+into\s+sessions\b/i.test(base);
        const query = isInsert && hasId && !/\breturning\b/i.test(base)
          ? `${base.replace(/;\s*$/, "")} RETURNING id`
          : base;
        const rows: any = normalizeRows(await connection().unsafe(query, params));
        const id = isInsert ? rows[0]?.id as number | bigint | undefined : undefined;
        return { changes: rows.count ?? rows.length, lastInsertRowid: id };
      },
    };
  },
};

function randomToken(len = 12) {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < len; i++) token += abc[Math.floor(Math.random() * abc.length)];
  return token;
}

/** Membuat nomor berurutan dari data yang sudah tersimpan. */
export async function buatNomorKunjungan(): Promise<string> {
  const tahun = new Date().getFullYear();
  const row = await db.prepare(
    "SELECT nomor FROM visit_applications WHERE nomor LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(`KUN-${tahun}-%`) as { nomor: string } | undefined;
  const urut = row ? Number(row.nomor.split("-")[2]) + 1 : 1;
  return `KUN-${tahun}-${String(urut).padStart(4, "0")}`;
}

export async function buatNomorPengaduan(): Promise<string> {
  const tahun = new Date().getFullYear();
  const row = await db.prepare(
    "SELECT nomor FROM facility_reports WHERE nomor LIKE ? ORDER BY id DESC LIMIT 1"
  ).get(`ADU-${tahun}-%`) as { nomor: string } | undefined;
  const urut = row ? Number(row.nomor.split("-")[2]) + 1 : 1;
  return `ADU-${tahun}-${String(urut).padStart(4, "0")}`;
}

export { randomToken };
