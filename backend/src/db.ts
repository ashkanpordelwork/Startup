import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL ?? "");

let initPromise: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          nickname TEXT,
          phone TEXT UNIQUE,
          name TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS otp_codes (
          id TEXT PRIMARY KEY,
          phone TEXT NOT NULL,
          code TEXT NOT NULL,
          attempts INTEGER NOT NULL DEFAULT 0,
          consumed BOOLEAN NOT NULL DEFAULT false,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS intake_responses (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          raw_answers TEXT NOT NULL,
          computed_track TEXT NOT NULL,
          message TEXT NOT NULL,
          title TEXT NOT NULL DEFAULT 'برنامه',
          status TEXT NOT NULL DEFAULT 'draft',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS action_items (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          intake_id TEXT NOT NULL REFERENCES intake_responses(id),
          category TEXT NOT NULL,
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          steps TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'in_progress',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS action_reports (
          id TEXT PRIMARY KEY,
          action_id TEXT NOT NULL REFERENCES action_items(id),
          user_id TEXT NOT NULL REFERENCES users(id),
          kind TEXT NOT NULL,
          note TEXT,
          reply TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS chat_messages (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id),
          role TEXT NOT NULL,
          text TEXT NOT NULL,
          related_action_id TEXT REFERENCES action_items(id),
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
      `;
    })();
  }
  return initPromise;
}
