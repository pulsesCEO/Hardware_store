const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 👇 Import the middleware you just created (adjust path if needed)
const authMiddleware = require('../middleware/authMiddleware'); 

// Public Routes (No token needed)
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/login', authController.login);

// Protected Routes (Requires Token)
// 👇 Add 'authMiddleware' before the controller function
router.post('/register', authMiddleware, authController.register);
router.get('/users', authMiddleware, authController.getAllUsers); 

// Add these below your existing protected routes
router.put('/users/:id', authMiddleware, authController.updateUser);
router.delete('/users/:id', authMiddleware, authController.deleteUser);


router.put('/users/:id/modules', authMiddleware, authController.updateUserModules);

module.exports = router;