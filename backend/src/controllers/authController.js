const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NGO = require('../models/NGO');

/**
 * Register new user
 */
async function register(req, res) {
  try {
    const { email, password, role, name, phone, ngoData } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Create user
    const userId = await User.create(email, password, role, name, phone);
    
    // If NGO, create NGO profile
    if (role === 'ngo' && ngoData) {
      await NGO.create({
        userId,
        ...ngoData
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId, email, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: userId, email, role, name }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Verify password
    const isValid = await User.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is inactive' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Get current user profile
 */
async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If NGO, include NGO profile
    if (user.role === 'ngo') {
      const ngo = await NGO.findByUserId(user.id);
      user.ngoProfile = ngo;
    }
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
}

/**
 * Update user profile
 */
async function updateProfile(req, res) {
  try {
    const { name, phone } = req.body;
    
    const updated = await User.update(req.user.userId, { name, phone });
    
    if (!updated) {
      return res.status(400).json({ error: 'No changes made' });
    }
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile
};
