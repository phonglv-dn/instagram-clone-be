import mongoose, { Schema, Document } from 'mongoose';
import { Post } from '../types';

interface IPost extends Post, Document { }

const postSchema = new Schema<IPost>(
  {
    creatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    imageUrl: { type: String, required: true },
    caption: { type: String },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    comments: [
      {
        creatorId: { type: Schema.Types.ObjectId, ref: 'User' },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IPost>('Post', postSchema);
