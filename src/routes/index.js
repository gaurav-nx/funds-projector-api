import express from 'express';
import authRoutes from './auth.routes.js';
import profileRoutes from './profile.routes.js';

const router = express.Router();

// Root API route
router.get('/', (req, res) => {
  res.json({
    message: 'Funds Project API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      profile: '/api/profile'
    }
  });
});

// Route handlers
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);

export default router;

