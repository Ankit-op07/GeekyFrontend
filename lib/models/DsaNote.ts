import mongoose, { Schema, Document, Types } from 'mongoose';

/**
 * DsaNote — one learner's private note on one problem.
 *
 * WHY THIS IS NOT A FIELD ON DsaProgress
 * --------------------------------------
 * It would fit there — same key space, same owner. But DsaProgress is read on
 * EVERY open of the tracker to render ~155 checkboxes, and it is deliberately
 * tiny so that read is cheap. Notes are long free text ("wrong on the shrink
 * condition, re-derive the invariant, ask about negatives next time"), and a
 * serious user writes them on most problems they attempt. Folding them in would
 * mean dragging tens of kilobytes of prose across the wire to draw a list of
 * ticks.
 *
 * So: ticks are bulk-read and small, notes are single-read and large. One
 * document per (user, problem), fetched only when a problem's drawer opens.
 *
 * The unique index is what makes the upsert in PUT /api/dsa/notes safe against
 * two tabs saving at once.
 */

/** Hard cap, enforced by the API before write. Generous for a study note; a
 *  bound the storage can rely on. */
export const DSA_NOTE_MAX_LENGTH = 8000;

export interface IDsaNote extends Document {
    userId: Types.ObjectId;
    /** Catalogue problem id. Validated against lib/dsa before write. */
    problemId: string;
    body: string;
    createdAt: Date;
    updatedAt: Date;
}

const DsaNoteSchema = new Schema<IDsaNote>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'CompanyKitUser',
            required: true,
        },
        problemId: { type: String, required: true },
        body: { type: String, default: '', maxlength: DSA_NOTE_MAX_LENGTH },
    },
    { timestamps: true }
);

// One note per user per problem.
DsaNoteSchema.index({ userId: 1, problemId: 1 }, { unique: true });

// Backs the "all my notes, most recent first" view without scanning.
DsaNoteSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.models.DsaNote ||
    mongoose.model<IDsaNote>('DsaNote', DsaNoteSchema);
