import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { Types } from 'mongoose';

export interface AuthRequest extends Request {
  user?: { id: string } | JwtPayload;
}

export interface User {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  profilePicture?: string;
  followers: string[];
  following: string[];
  isDeleted: boolean;
}

export interface Post {
  creatorId: Types.ObjectId;
  imageUrl: string;
  caption?: string;
  likes: Types.ObjectId[];
  comments: { creatorId: Types.ObjectId; text: string; createdAt: Date }[];
  isDeleted: boolean;
}
