import { NextApiRequest, NextApiResponse } from 'next';
import connectToDatabase from '../../../lib/mongodb';
import User, { IUser } from '../../../models/User';
import { generateToken, verifyToken } from '../../../lib/auth';

// Type definitions for request body
interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

/**
 * POST /api/auth/register - Register a new user
 * POST /api/auth/login - Login user
 * POST /api/auth/verify - Verify JWT token
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle user registration
  if (req.method === 'POST' && req.query.action === 'register') {
    try {
      const { name, email, password }: RegisterRequest = req.body;

      // Validate required fields
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Name, email, and password are required'
        });
      }

      // Validate email format
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Please enter a valid email address'
        });
      }

      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Password must be at least 6 characters long'
        });
      }

      // Connect to database
      await connectToDatabase();

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'User exists',
          message: 'A user with this email already exists'
        });
      }

      // Create new user
      const newUser = new User({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password
      });

      // Save user to database
      const savedUser = await newUser.save();

      // Generate JWT token
      const token = generateToken((savedUser._id as any).toString(), savedUser.email);

      // Return success response (exclude password)
      return res.status(201).json({
        success: true,
        data: {
          user: {
            id: savedUser._id,
            name: savedUser.name,
            email: savedUser.email,
            createdAt: savedUser.createdAt
          },
          token
        },
        message: 'User registered successfully'
      });

    } catch (error) {
      console.error('Error registering user:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to register user'
      });
    }
  }

  // Handle user login
  if (req.method === 'POST' && req.query.action === 'login') {
    try {
      const { email, password }: LoginRequest = req.body;

      // Validate required fields
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Email and password are required'
        });
      }

      // Connect to database
      await connectToDatabase();

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Authentication failed',
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token
      const token = generateToken((user._id as any).toString(), user.email);

      // Return success response (exclude password)
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
          },
          token
        },
        message: 'Login successful'
      });

    } catch (error) {
      console.error('Error logging in user:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to login'
      });
    }
  }

  // Handle token verification
  if (req.method === 'POST' && req.query.action === 'verify') {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Token is required'
        });
      }

      // Verify token
      const payload = verifyToken(token);
      if (!payload) {
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Token is invalid or expired'
        });
      }

      // Connect to database
      await connectToDatabase();

      // Find user to ensure they still exist
      const user = await User.findById(payload.userId);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found',
          message: 'User associated with token no longer exists'
        });
      }

      // Return success response
      return res.status(200).json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            createdAt: user.createdAt
          }
        },
        message: 'Token is valid'
      });

    } catch (error) {
      console.error('Error verifying token:', error);
      
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to verify token'
      });
    }
  }

  // Handle unsupported methods
  return res.status(405).json({
    success: false,
    error: 'Method not allowed',
    message: 'Only POST method is allowed for this endpoint'
  });
}
