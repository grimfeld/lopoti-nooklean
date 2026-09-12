import { describe, expect, it } from 'vitest';

import { ALLOW_MARKER, inspectSql } from './guard';

/**
 * The destructive-SQL guard is the thing standing between an AI-authored
 * migration and a table of real customer requests. These tests pin down what
 * it rejects and — just as importantly — what it must not reject, because a
 * guard that blocks ordinary migrations would get disabled.
 */
describe('inspectSql', () => {
  it('allows an ordinary forward-only migration', () => {
    const sql = `
      CREATE TABLE IF NOT EXISTS widgets (
        id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        label TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS widgets_label_idx ON widgets (label);
      ALTER TABLE widgets ADD COLUMN IF NOT EXISTS note TEXT;
    `;
    expect(inspectSql('002_widgets.sql', sql)).toEqual([]);
  });

  it.each([
    ['DROP TABLE', 'DROP TABLE requests;'],
    ['DROP COLUMN', 'ALTER TABLE requests DROP COLUMN email;'],
    ['TRUNCATE', 'TRUNCATE requests;'],
    ['DROP SCHEMA', 'DROP SCHEMA public CASCADE;'],
    ['DROP DATABASE', 'DROP DATABASE lopoti_nooklean;'],
  ])('rejects %s', (label, sql) => {
    const violations = inspectSql('bad.sql', sql);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.statement).toBe(label);
  });

  it('rejects an unqualified DELETE', () => {
    const violations = inspectSql('bad.sql', 'DELETE FROM requests;');
    expect(violations.map((v) => v.statement)).toContain('DELETE without WHERE');
  });

  it('allows a scoped DELETE, which only touches the rows it names', () => {
    const sql = "DELETE FROM site_config WHERE cle = 'obsolete_key';";
    expect(inspectSql('ok.sql', sql)).toEqual([]);
  });

  it('rejects a column type change, which can silently lose data', () => {
    const sql = 'ALTER TABLE requests ALTER COLUMN telephone TYPE INTEGER;';
    const violations = inspectSql('bad.sql', sql);
    expect(violations.map((v) => v.statement)).toContain('ALTER COLUMN ... TYPE');
  });

  it('ignores destructive keywords inside comments', () => {
    const sql = `
      -- We deliberately do NOT drop table requests here; see docs/decisions.md.
      /* A previous draft used TRUNCATE — never do that. */
      ALTER TABLE requests ADD COLUMN IF NOT EXISTS note TEXT;
    `;
    expect(inspectSql('ok.sql', sql)).toEqual([]);
  });

  it('ignores destructive keywords inside string literals', () => {
    const sql = `
      INSERT INTO site_config (brand, cle, valeur)
      VALUES ('shared', 'hint', '"do not DROP TABLE anything"'::jsonb);
    `;
    expect(inspectSql('ok.sql', sql)).toEqual([]);
  });

  it('ignores keywords inside a dollar-quoted function body', () => {
    const sql = `
      CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
      BEGIN
        -- TRUNCATE mentioned here must not trip the guard.
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;
    expect(inspectSql('ok.sql', sql)).toEqual([]);
  });

  it('honours the explicit opt-out marker', () => {
    const sql = `
      -- ${ALLOW_MARKER}
      -- Dropping an abandoned table that never held production data.
      DROP TABLE scratch_experiment;
    `;
    expect(inspectSql('opt-out.sql', sql)).toEqual([]);
  });

  it('reports every distinct problem in one file', () => {
    const sql = 'DROP TABLE a; TRUNCATE b;';
    const statements = inspectSql('bad.sql', sql).map((v) => v.statement);
    expect(statements).toEqual(expect.arrayContaining(['DROP TABLE', 'TRUNCATE']));
  });

  it('matches case-insensitively, since SQL keywords are not case sensitive', () => {
    expect(inspectSql('bad.sql', 'drop table requests;')).toHaveLength(1);
  });
});
