import { Router, Response, Request } from 'express';
import Post from '../models/Post';
import { authMiddleware } from '../middleware/auth';
import { AuthRequest } from '../types';
import { ParsedQs } from 'qs';
import upload from '../middleware/upload.middleware';

const router = Router();

router.post('/', authMiddleware, upload.single('image'),
  async (req: AuthRequest, res: Response) => {
    try {
      const caption = req.body.caption;
      const file = req.file as Express.Multer.File;

      if (!file) {
        res.status(400).json({ message: 'Image is required' });
        return
      }

      const post = new Post({
        creatorId: req.user?.id,
        imageUrl: (file as any).path,
        caption,
      });

      await post.save();
      res.status(201).json(post);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }
);

// Get all posts (Posts have not been deleted)
router.get('/', async (req: Request<{}, {}, {}, ParsedQs>, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const skip = (page - 1) * limit;

    const [count, posts] = await Promise.all([
      Post.countDocuments({ isDeleted: false }),
      Post.find({ isDeleted: false })
        .populate('creatorId', 'username profilePicture')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
    ]);

    const totalPages = Math.ceil(count / limit);

    res.json({
      count,
      currentPage: page,
      totalPages,
      next: page < totalPages ? `/api/posts?page=${page + 1}&limit=${limit}` : null,
      prev: page > 1 ? `/api/posts?page=${page - 1}&limit=${limit}` : null,
      results: posts,
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single post
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const post = await Post.findById(req.params.id).populate('creatorId', 'username profilePicture');
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Update a post
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    if (post.creatorId.toString() !== req.user?.id) {
      res.status(403).json({ message: 'You are not authorized to update this post' });
      return;
    }
    post.caption = req.body.caption;
    await post.save();
    res.json(post);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Soft delete a post
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      res.status(404).json({ message: 'Post not found' });
      return;
    }
    if (post.creatorId.toString() !== req.user?.id) {
      res.status(403).json({ message: 'You are not authorized to delete this post' });
      return;
    }
    post.isDeleted = true;
    await post.save();
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
