import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { env } from '../config/env';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import upload from '../middleware/upload.middleware';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password, fullName } = req.body;
  try {
    if (!username) {
      res.status(400).json({ message: 'Username is required' });
      return;
    }

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    if (!password) {
      res.status(400).json({ message: 'Password is required' });
      return;
    }

    if (!fullName) {
      res.status(400).json({ message: 'Full name is required' });
      return;
    }

    let user = await User.findOne({ email });
    if (user) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    user = new User({ username, email, password, fullName });
    await user.save();

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({
      token,
      user: { id: user._id, username, email, fullName },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    if (!password) {
      res.status(400).json({ message: 'Password is required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid credentials' });
      return
    }

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      user: { id: user._id, username: user.username, email, fullName: user.fullName },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    user.fullName = req.body.fullName;
    await user.save();
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get user profile
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put(
  '/profile',
  authMiddleware,
  upload.single('avatar'),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await User.findById(req.user?.id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const fullName = req.body.fullName;
      const file = req.file as Express.Multer.File;

      if (!fullName && !file) {
        res.status(400).json({ message: 'Nothing to update' });
        return;
      }

      if (fullName) {
        user.fullName = fullName;
      }

      if (file) {
        user.profilePicture = (file as any).path;
      }

      await user.save();

      res.status(200).json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          fullName: user.fullName,
          profilePicture: user.profilePicture,
          email: user.email,
        },
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;
