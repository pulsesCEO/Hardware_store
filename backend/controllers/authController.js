const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendOTPEmail = require('../utils/emailSender');
const { Op } = require('sequelize');

// A secret key used to generate the token (in a real app, keep this in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_hardware_key';

// 1. Register a new user
// 1. Register
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        
        // 🔒 SECURITY: If an Admin is creating a user, force the role to 'staff'
        let finalRole = role;
        if (req.user && req.user.role !== 'super_admin') {
            finalRole = 'staff'; 
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newUser = await User.create({ 
            name, 
            email, 
            password: hashedPassword, 
            role: finalRole,
            created_by: req.user ? req.user.id : null // 👈 Save who created this user
        });
        
        res.status(201).json({ message: "User created successfully", user: { id: newUser.id, name, email, role: finalRole } });
    } catch (error) {
        console.error(error);
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: "Email already exists" });
        }
        res.status(500).json({ error: "Failed to create user" });
    }
};



// 2. Login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ error: "Invalid email or password" });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        res.json({ 
            message: "Login successful", 
            token, 
            user: { 
                id: user.id, 
                name: user.name, 
                role: user.role, 
                email: user.email,
                // 👇 🚀 ADD THIS LINE HERE 👇
                enabled_modules: user.enabled_modules || [] 
            } 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Login failed" });
    }
};

// 3. Get all users (For the User Management page)
// 2. Get all users
exports.getAllUsers = async (req, res) => {
    try {
        let whereClause = {};

        // 🔒 If logged in as 'admin', ONLY show staff they created
        if (req.user && req.user.role === 'admin') {
            whereClause = { 
                created_by: req.user.id,
                role: 'staff' 
            };
        } 

        const users = await User.findAll({
            where: whereClause,
            attributes: { exclude: ['password'] }, 
            order: [['id', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
};




// 4. FORGOT PASSWORD (Generate OTP)
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ error: "User with this email does not exist." });
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP and expiry (10 minutes)
        user.reset_password_token = otp;
        user.reset_password_expires = Date.now() + 600000; // 10 mins
        await user.save();

        // Try sending the email
        const emailSent = await sendOTPEmail(email, otp);
        
        if (emailSent) {
            res.json({ message: "OTP has been sent to your email address." });
        } else {
            // Offline fallback
            console.log("=========================================");
            console.log(`🔐 OFFLINE PASSWORD RESET FOR: ${email}`);
            console.log(`🔑 YOUR OTP IS: ${otp}`);
            console.log("=========================================");
            
            res.json({ message: "Offline mode: OTP generated. Please check the server terminal." });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to process request" });
    }
};

// 5. RESET PASSWORD (Verify OTP & Save new password)
exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, password } = req.body;

        // Find user with matching email and valid OTP
        const user = await User.findOne({ 
            where: { 
                email: email,
                reset_password_token: otp,
                reset_password_expires: { [Op.gt]: Date.now() } 
            } 
        });

        if (!user) {
            return res.status(400).json({ error: "Invalid OTP or OTP has expired." });
        }

        // Hash new password
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update password and clear OTP
        user.password = hashedPassword;
        user.reset_password_token = null;
        user.reset_password_expires = null;
        await user.save();

        res.json({ message: "Password reset successfully. You can now login." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to reset password" });
    }
};  



// 6. UPDATE USER (Admin/Sir editing a user)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password } = req.body;

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Update basic fields
        user.name = name || user.name;
        user.email = email || user.email;

        // Only update password if a new one was typed
        if (password && password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }

        await user.save();
        res.json({ message: "User updated successfully", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update user" });
    }
};

// 7. DELETE USER
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await user.destroy();
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to delete user" });
    }
};

// 8. UPDATE USER MODULES (Save permissions)
exports.updateUserModules = async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled_modules } = req.body; // 👈 USING enabled_modules

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        await user.update({ enabled_modules: enabled_modules });
        
        res.json({ message: "Permissions updated successfully", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to update user permissions" });
    }
};