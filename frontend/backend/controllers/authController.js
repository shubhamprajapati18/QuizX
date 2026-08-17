const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET || 'quizx_super_secret_jwt_key_2026_faculty_auth';

// Register Faculty
exports.register = async (req, res) => {
  try {
    const { name, email, password, institution, department } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('faculties')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert new faculty
    const newFaculty = {
      name,
      email: email.toLowerCase().trim(),
      password_hash,
      institution: institution || 'Independent Educator',
      department: department || 'General',
      role: 'faculty'
    };

    const { data: inserted, error } = await supabase
      .from('faculties')
      .insert([newFaculty])
      .select('id, name, email, institution, department, role, created_at')
      .single();

    if (error) {
      console.error('Registration Supabase error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create account in database.', error: error.message });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: inserted.id, email: inserted.email, name: inserted.name, institution: inserted.institution },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Faculty account created successfully!',
      token,
      faculty: inserted
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during registration.' });
  }
};

// Login Faculty
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    // Fetch user
    const { data: faculty, error } = await supabase
      .from('faculties')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (error || !faculty) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, faculty.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: faculty.id, email: faculty.email, name: faculty.name, institution: faculty.institution },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const facultyData = {
      id: faculty.id,
      name: faculty.name,
      email: faculty.email,
      institution: faculty.institution,
      department: faculty.department,
      role: faculty.role,
      created_at: faculty.created_at
    };

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      faculty: facultyData
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login.' });
  }
};

// Get current faculty profile
exports.getProfile = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
    const { data: faculty, error } = await supabase
      .from('faculties')
      .select('id, name, email, institution, department, role, avatar_url, created_at')
      .eq('id', facultyId)
      .single();

    if (error || !faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }

    return res.status(200).json({ success: true, faculty });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

// Update profile
exports.updateProfile = async (req, res) => {
  try {
    const facultyId = req.faculty.id;
    const { name, institution, department, currentPassword, newPassword } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (institution) updateData.institution = institution;
    if (department) updateData.department = department;

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required to set a new password.' });
      }

      const { data: faculty } = await supabase
        .from('faculties')
        .select('password_hash')
        .eq('id', facultyId)
        .single();

      if (faculty) {
        const isMatch = await bcrypt.compare(currentPassword, faculty.password_hash);
        if (!isMatch) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }

        const salt = await bcrypt.genSalt(10);
        updateData.password_hash = await bcrypt.hash(newPassword, salt);
      }
    }

    const { data: updated, error } = await supabase
      .from('faculties')
      .update(updateData)
      .eq('id', facultyId)
      .select('id, name, email, institution, department, role')
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }

    return res.status(200).json({ success: true, message: 'Profile updated successfully!', faculty: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Server error updating profile.' });
  }
};
