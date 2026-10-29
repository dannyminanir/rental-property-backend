const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/User');

// Helper: generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ──────────────────────────────────────────────
// POST /api/auth/register  (landlord sign-up)
// ──────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const body = req.body || {};
    const { name, password } = body;
    const email = typeof body.email === 'string'
      ? body.email.trim().toLowerCase()
      : '';

    if (typeof name !== 'string' || !name.trim() || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      name: name.trim(),
      email,
      password,
      role: 'landlord',
      isApproved: false, // must wait for admin approval
    });

    res.status(201).json({
      message: 'Registration successful. Please wait for admin approval before logging in.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    next(error);
  }
};

// ──────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (user.isBlocked) {
      return res.status(403).json({
        error: 'Your account has been blocked',
        reason: user.blockReason || 'Contact admin for details',
      });
    }

    if (user.role === 'landlord' && !user.isApproved) {
      return res.status(403).json({
        error: 'Your account is pending admin approval',
      });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/auth/me  (get current logged-in user)
// ──────────────────────────────────────────────
exports.getMe = async (req, res, next) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isApproved: req.user.isApproved,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// POST /api/auth/invite  (landlord invites a tenant)
// ──────────────────────────────────────────────
exports.createInvite = async (req, res, next) => {
  try {
    const Unit = require('../models/Unit');
    const Invite = require('../models/Invite');
    const { email, unitId } = req.body;

    // Verify the unit belongs to the landlord
    const unit = await Unit.findById(unitId).populate('property');
    if (!unit) {
      return res.status(404).json({ error: 'Unit not found' });
    }
    if (unit.property.landlord.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'You do not own this unit' });
    }
    if (unit.isOccupied) {
      return res.status(400).json({ error: 'This unit is already occupied' });
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await Invite.create({
      landlord: req.user._id,
      unit: unitId,
      email,
      token,
      expiresAt,
    });

    const inviteLink = `${process.env.CLIENT_URL}/invite/${token}`;

    res.status(201).json({
      message: 'Invite created. Share the link with the tenant.',
      inviteLink,
      invite: {
        id: invite._id,
        email: invite.email,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// POST /api/auth/invite/:token  (tenant registers via invite)
// ──────────────────────────────────────────────
exports.registerWithInvite = async (req, res, next) => {
  try {
    const Invite = require('../models/Invite');
    const Lease = require('../models/Lease');
    const Unit = require('../models/Unit');
    const { token } = req.params;
    const { name, password } = req.body;

    const invite = await Invite.findOne({ token });
    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite link' });
    }
    if (invite.isUsed) {
      return res.status(400).json({ error: 'This invite has already been used' });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This invite has expired' });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email: invite.email });
    if (existingUser) {
      return res.status(400).json({ error: 'This email is already registered' });
    }

    // Create tenant account
    const tenant = await User.create({
      name,
      email: invite.email,
      password,
      role: 'tenant',
      isApproved: true, // tenants are auto-approved via invite
    });

    // Create lease
    await Lease.create({
      unit: invite.unit,
      tenant: tenant._id,
      startDate: new Date(),
      isActive: true,
    });

    // Mark unit as occupied
    await Unit.findByIdAndUpdate(invite.unit, { isOccupied: true });

    // Mark invite as used
    invite.isUsed = true;
    await invite.save();

    const jwtToken = generateToken(tenant._id);

    res.status(201).json({
      message: 'Account created successfully!',
      token: jwtToken,
      user: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
        role: tenant.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────────────
// GET /api/auth/invite/:token  (validate invite)
// ──────────────────────────────────────────────
exports.validateInvite = async (req, res, next) => {
  try {
    const Invite = require('../models/Invite');
    const invite = await Invite.findOne({ token: req.params.token })
      .populate({
        path: 'unit',
        populate: { path: 'property', select: 'name address' },
      })
      .populate('landlord', 'name');

    if (!invite) {
      return res.status(404).json({ error: 'Invalid invite link' });
    }
    if (invite.isUsed) {
      return res.status(400).json({ error: 'This invite has already been used' });
    }
    if (invite.expiresAt < new Date()) {
      return res.status(400).json({ error: 'This invite has expired' });
    }

    res.json({
      email: invite.email,
      unit: invite.unit,
      landlord: invite.landlord,
    });
  } catch (error) {
    next(error);
  }
};
