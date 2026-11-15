const User = require('../models/userModel');

const getAllowedUserIds = async (userId, role) => {
    // 1. Sir sees everything (return null means no filter needed)
    if (role === 'super_admin') return null;

    // 2. Start with the user's own ID
    let allowedIds = [parseInt(userId)];

    if (role === 'admin') {
        // 3. If Admin, find all staff they created and add them
        const staff = await User.findAll({ where: { created_by: userId } });
        staff.forEach(s => allowedIds.push(s.id));
    } 
    else if (role === 'staff') {
        // 4. If Staff, add the Admin who created them
        const user = await User.findByPk(userId);
        if (user && user.created_by) {
            allowedIds.push(user.created_by);
        }
    }

    return allowedIds;
};

module.exports = getAllowedUserIds;