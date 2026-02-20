import express from 'express';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import Staff from '../models/Staff.js';
import Patient from '../models/Patient.js';
import { loginRateLimiter } from '../middleware/rateLimiter.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../utils/errors.js';

const router = express.Router();

/**
 * Staff Login
 */
router.post('/login', loginRateLimiter, async (req, res, next) => {
  try {
    const { username, password, twoFaToken } = req.body;
    
    console.log('=== LOGIN ATTEMPT ===');
    console.log('Username:', username);
    console.log('Password length:', password?.length);
    console.log('Username lowercase:', username?.toLowerCase());
    
    if (!username || !password) {
      throw new AppError('Username and password required', 400);
    }
    
    // Find staff by username
    const staff = await Staff.findOne({ 
      username: username.toLowerCase(),
      status: 'active'
    });
    
    console.log('Staff found:', !!staff);
    if (staff) {
      console.log('  Username in DB:', staff.username);
      console.log('  Role:', staff.role);
      console.log('  Status:', staff.status);
    }
    
    if (!staff) {
      console.log('❌ Staff not found with username:', username.toLowerCase());
      throw new AppError('Invalid credentials', 401);
    }
    
    // Verify password
    const isValidPassword = await staff.comparePassword(password);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      throw new AppError('Invalid credentials', 401);
    }
    
    // Check 2FA if enabled
    if (staff.two_factor_enabled) {
      if (!twoFaToken) {
        return res.json({
          success: true,
          requires2FA: true,
          message: '2FA token required'
        });
      }
      
      const verified = speakeasy.totp.verify({
        secret: staff.two_factor_secret,
        encoding: 'base32',
        token: twoFaToken,
        window: 2
      });
      
      if (!verified) {
        throw new AppError('Invalid 2FA token', 401);
      }
    }
    
    // Generate tokens
    const accessToken = jwt.sign(
      { 
        userId: staff._id.toString(),
        role: staff.role,
        username: staff.username
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId: staff._id.toString() },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
    
    // Store refresh token
    staff.refresh_token = refreshToken;
    staff.last_login = new Date();
    await staff.save({ validateBeforeSave: false });
    
    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: staff._id,
        username: staff.username,
        email: staff.email,
        first_name: staff.first_name,
        last_name: staff.last_name,
        full_name: staff.full_name,
        role: {
          name: staff.role
        },
        role_name: staff.role,
        phone: staff.phone,
        department: staff.department,
        specialization: staff.specialization,
        profile_image: staff.profile_image
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Patient Login
 */
router.post('/patient-login', loginRateLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      throw new AppError('Username va parol majburiy', 400);
    }
    
    // Find patient by username or patient_number
    const patient = await Patient.findOne({
      $or: [
        { username: username.toLowerCase() },
        { patient_number: username.toUpperCase() }
      ],
      status: 'active'
    });
    
    if (!patient) {
      throw new AppError('Login yoki parol noto\'g\'ri', 401);
    }
    
    // Verify password
    const isValidPassword = await patient.comparePassword(password);
    if (!isValidPassword) {
      throw new AppError('Login yoki parol noto\'g\'ri', 401);
    }
    
    // Generate tokens
    const accessToken = jwt.sign(
      { 
        userId: patient._id.toString(),
        patient_id: patient._id.toString(),
        username: patient.username || patient.patient_number,
        roleName: 'Bemor',
        type: 'patient'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
    
    const refreshToken = jwt.sign(
      { 
        userId: patient._id.toString(),
        patient_id: patient._id.toString(),
        type: 'patient'
      },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );
    
    // Store refresh token
    patient.refresh_token = refreshToken;
    patient.last_visit = new Date();
    await patient.save();
    
    res.json({
      success: true,
      message: 'Login muvaffaqiyatli',
      user: {
        id: patient._id,
        patient_number: patient.patient_number,
        username: patient.username || patient.patient_number,
        full_name: patient.full_name,
        first_name: patient.first_name,
        last_name: patient.last_name,
        phone: patient.phone,
        role: {
          name: 'Bemor'
        },
        role_name: 'Bemor'
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Refresh Token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new AppError('Refresh token required', 400);
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    let user;
    let role;
    
    if (decoded.type === 'patient') {
      user = await Patient.findOne({
        _id: decoded.userId,
        refresh_token: refreshToken,
        status: 'active'
      });
      role = 'Bemor';
    } else {
      user = await Staff.findOne({
        _id: decoded.userId,
        refresh_token: refreshToken,
        status: 'active'
      });
      role = user?.role;
    }
    
    if (!user) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
    
    const accessToken = jwt.sign(
      { 
        userId: user._id.toString(),
        role: role,
        username: user.username,
        ...(decoded.type === 'patient' && { 
          patient_id: user._id.toString(),
          type: 'patient',
          roleName: 'Bemor'
        })
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m' }
    );
    
    res.json({
      success: true,
      accessToken
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Logout
 */
router.post('/logout', authenticate, async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, { ignoreExpiration: true });
      
      if (decoded.type === 'patient') {
        await Patient.findByIdAndUpdate(decoded.userId, { refresh_token: null });
      } else {
        await Staff.findByIdAndUpdate(decoded.userId, { refresh_token: null });
      }
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Enable 2FA
 */
router.post('/2fa/enable', authenticate, async (req, res, next) => {
  try {
    const secret = speakeasy.generateSecret({
      name: `${process.env.TWO_FA_ISSUER || 'ClinicManagement'} (${req.user.username})`
    });
    
    await Staff.findByIdAndUpdate(req.user.id, {
      two_factor_secret: secret.base32
    });
    
    res.json({
      success: true,
      secret: secret.base32,
      qrCode: secret.otpauth_url
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Verify and activate 2FA
 */
router.post('/2fa/verify', authenticate, async (req, res, next) => {
  try {
    const { token } = req.body;
    
    const staff = await Staff.findById(req.user.id);
    
    if (!staff || !staff.two_factor_secret) {
      throw new AppError('2FA not initialized', 400);
    }
    
    const verified = speakeasy.totp.verify({
      secret: staff.two_factor_secret,
      encoding: 'base32',
      token,
      window: 2
    });
    
    if (!verified) {
      throw new AppError('Invalid token', 400);
    }
    
    staff.two_factor_enabled = true;
    await staff.save();
    
    res.json({
      success: true,
      message: '2FA enabled successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Update credentials
 */
router.put('/update-credentials', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newUsername, newPassword } = req.body;
    
    if (!currentPassword || !newUsername) {
      return res.status(400).json({
        success: false,
        message: 'Joriy parol va yangi login majburiy'
      });
    }

    const staff = await Staff.findById(req.user.id).select('+password');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Foydalanuvchi topilmadi'
      });
    }

    const isPasswordValid = await staff.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Joriy parol noto\'g\'ri'
      });
    }

    // Check if new username already exists
    if (newUsername !== staff.username) {
      const existingStaff = await Staff.findOne({
        username: newUsername.toLowerCase(),
        _id: { $ne: staff._id }
      });

      if (existingStaff) {
        return res.status(400).json({
          success: false,
          message: 'Bu login allaqachon band'
        });
      }
      
      staff.username = newUsername.toLowerCase();
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak'
        });
      }
      staff.password = newPassword;
    }

    await staff.save();

    res.json({
      success: true,
      message: 'Login va parol muvaffaqiyatli o\'zgartirildi',
      data: {
        id: staff._id,
        username: staff.username,
        email: staff.email,
        full_name: staff.full_name
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
