const Gst = require('../../models/mastersModel/gstModel');
const getAllowedUserIds = require('../../utils/getAllowedUserIds');
const { Op } = require('sequelize');

exports.getAllGst = async (req, res) => {
    try {
        const { user_id, role } = req.query;
        let whereClause = {};
        
        const allowedIds = await getAllowedUserIds(user_id, role);
        if (allowedIds) {
            whereClause.created_by = { [Op.in]: allowedIds };
        }

        const gstList = await Gst.findAll({ where: whereClause, order: [['id', 'DESC']] });
        res.json(gstList);
    } catch (error) { 
        res.status(500).json({ error: "Failed to fetch GST" }); 
    }
};

// ... (Keep your createGst, updateGst, and deleteGst as they are)
exports.createGst = async (req, res) => {
    try {
        const newGst = await Gst.create(req.body);
        res.status(201).json(newGst);
    } catch (error) { res.status(500).json({ error: "Failed to create GST" }); }
};

exports.updateGst = async (req, res) => {
    try {
        const [updated] = await Gst.update(req.body, { where: { id: req.params.id } });
        if (updated) {
            const updatedGst = await Gst.findByPk(req.params.id);
            res.status(200).json(updatedGst);
        } else { res.status(404).json({ error: "GST not found" }); }
    } catch (error) { res.status(500).json({ error: "Failed to update GST" }); }
};

exports.deleteGst = async (req, res) => {
    try {
        const deleted = await Gst.destroy({ where: { id: req.params.id } });
        if (deleted) { res.status(200).json({ message: "GST deleted" }); } 
        else { res.status(404).json({ error: "GST not found" }); }
    } catch (error) { res.status(500).json({ error: "Failed to delete GST" }); }
};