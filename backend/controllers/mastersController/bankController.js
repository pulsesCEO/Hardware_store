const Bank = require('../../models/mastersModel/bankModel');
const getAllowedUserIds = require('../../utils/getAllowedUserIds');
const { Op } = require('sequelize');

exports.getAllBanks = async (req, res) => {
    try {
        const { user_id, role } = req.query;
        let whereClause = {};
        
        const allowedIds = await getAllowedUserIds(user_id, role);
        if (allowedIds) {
            whereClause.created_by = { [Op.in]: allowedIds };
        }

        const banks = await Bank.findAll({ where: whereClause, order: [['id', 'DESC']] });
        res.json(banks);
    } catch (error) { 
        res.status(500).json({ error: "Failed to fetch banks" }); 
    }
};

// ... (Keep your createBank, updateBank, and deleteBank as they are)
exports.createBank = async (req, res) => {
    try { res.status(201).json(await Bank.create(req.body)); } 
    catch (error) { res.status(500).json({ error: "Failed to create bank" }); }
};
exports.updateBank = async (req, res) => {
    try {
        const [updated] = await Bank.update(req.body, { where: { id: req.params.id } });
        if (updated) res.status(200).json(await Bank.findByPk(req.params.id));
        else res.status(404).json({ error: "Bank not found" });
    } catch (error) { res.status(500).json({ error: "Failed to update bank" }); }
};
exports.deleteBank = async (req, res) => {
    try {
        const deleted = await Bank.destroy({ where: { id: req.params.id } });
        if (deleted) res.status(200).json({ message: "Bank deleted" });
        else res.status(404).json({ error: "Bank not found" });
    } catch (error) { res.status(500).json({ error: "Failed to delete bank" }); }
};