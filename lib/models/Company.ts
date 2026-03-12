import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
    name: string;
    slug: string;
    logo: string;      // emoji e.g. "🔍" OR image URL e.g. "https://..."
    color: string;     // tailwind gradient e.g. "from-blue-500 to-green-500"
    createdAt: Date;
    updatedAt: Date;
}

const CompanySchema = new Schema<ICompany>({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    logo: { type: String, required: true, default: '🏢' },
    color: { type: String, required: true, default: 'from-violet-500 to-purple-500' },
}, { timestamps: true });

export default mongoose.models.Company || mongoose.model<ICompany>('Company', CompanySchema);
