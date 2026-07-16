// relations.ts — model relationships + eager loading (A6). Relations reference the related
// model through a THUNK (`() => Comment`) to sidestep definition-order / circular-import issues.
// Eager loading (`.with('comments')`) batch-loads each relation in ONE query keyed by the
// parent keys, so N parents never cause N+1 queries.

import type { ApexModel } from './model.js'

export type RelationKind = 'hasMany' | 'hasOne' | 'belongsTo'

export interface RelationDef {
  kind: RelationKind
  /** Lazily resolve the related model (avoids circular imports / ordering). */
  related: () => ApexModel
  /** The FK column: on the CHILD table for hasMany/hasOne; on THIS table for belongsTo. */
  foreignKey: string
  /** The key the FK points at: THIS table's key (hasMany/hasOne) or the RELATED pk (belongsTo). */
  localKey: string
}

/** This model has many `related` rows, each carrying `foreignKey` → this row's `localKey` (default `id`). */
export function hasMany(
  related: () => ApexModel,
  foreignKey: string,
  localKey = 'id',
): RelationDef {
  return { kind: 'hasMany', related, foreignKey, localKey }
}

/** This model has one `related` row (as hasMany, but a single result / `null`). */
export function hasOne(related: () => ApexModel, foreignKey: string, localKey = 'id'): RelationDef {
  return { kind: 'hasOne', related, foreignKey, localKey }
}

/** This model belongs to a `related` row: this table's `foreignKey` → related's `ownerKey` (default `id`). */
export function belongsTo(
  related: () => ApexModel,
  foreignKey: string,
  ownerKey = 'id',
): RelationDef {
  return { kind: 'belongsTo', related, foreignKey, localKey: ownerKey }
}
