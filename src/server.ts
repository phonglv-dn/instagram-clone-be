import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { connectDB } from './config/db';
import authRoutes from './routes/auth';
import postRoutes from './routes/posts';
import { env } from './config/env';

const app: Express = express();

app.use(cors());
app.use(express.json());

connectDB();

app.get('/', (_req: Request, res: Response) => {
  res.send('Instagram Clone API');
});

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`http://localhost:${PORT}`);
});
