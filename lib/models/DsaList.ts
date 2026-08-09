import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * DsaList — a learner's own named collection of problems.
 *
 * WHY THIS IS SEPARATE FROM `favourite` ON DsaProgress
 * ----------------------------------------------------
 * They answer different questions and the friction is deliberately different.
 * A star is one click and means "find this again" — no naming, no decision, and
 * every learner will use it. A list is an act of organisation ("Revise before
 * Amazon", "Got it wrong twice") and costs a name. Collapsing them into one
 * feature would either make starring cost a dialog, or make lists impossible.
 *
 * So the star stays where it is, as a boolean on the progress map, and lists
 * live here.
 *
 * SHAPE: one document per (user, list), holding an array of problem ids. Not a
 * per-user document with a nested array of lists — a list is the thing that
 * gets renamed, deleted and shared, so it wants its own _id to address. And the
 * membership array is bounded by the catalogue (155), so it can never grow
 * unboundedly the way a per-user aggregate would.
 *
 * ⚠️  `problemIds` entries are validated against the authored catalogue before
 * every write. Unlike DsaProgress these are array VALUES rather than update
 * paths, so there is no injection risk — but an unvalidated id would render as
 * a dead row that no page can resolve, which is its own kind of broken.
 */

/** Hard cap on lists per user. Generous for real use; a bound the UI can rely
 *  on so the picker never becomes an unscrollable wall. */
export const DSA_MAX_LISTS = 30;

/** Hard cap on a list name. Long enough to be descriptive, short enough to fit
 *  a chip without truncating in the middle of a word. */
export const DSA_LIST_NAME_MAX = 40;

export interface IDsaList extends Document {
    userId: Types.ObjectId;
    name: string;
    /**
     * Catalogue problem ids, in the order they were added.
     *
     * Insertion order, not sorted: a learner building "do these before Friday"
     * is expressing a sequence, and re-sorting to catalogue order would discard
     * information they entered deliberately.
     */
    problemIds: string[];
    createdAt: Date;
    updatedAt: Date;
}

const DsaListSchema = new Schema<IDsaList>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'CompanyKitUser',
            required: true,
        },
        name: { type: String, required: true, maxlength: DSA_LIST_NAME_MAX },
        problemIds: [{ type: String }],
    },
    { timestamps: true }
);

/**
 * One list per name per user.
 *
 * This is what makes "create a list" idempotent against a double-click and
 * against two open tabs: the second insert loses on the index rather than
 * producing two lists a learner then has to reconcile by hand.
 *
 * Case-insensitive via a collation with strength 2, so "Revise" and "revise"
 * collide — which is what a person expects, and prevents a near-duplicate pair
 * that is impossible to tell apart in the picker.
 */
DsaListSchema.index(
    { userId: 1, name: 1 },
    { unique: true, collation: { locale: 'en', strength: 2 } }
);

// Backs the "all my lists, newest first" fetch without a scan.
DsaListSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.DsaList ||
    mongoose.model<IDsaList>('DsaList', DsaListSchema);
