const Supplier = require('../../models/mastersModel/supplierModel');

// 1. GET ALL SUPPLIERS (Filtered by Admin)
exports.getAllSuppliers = async (req, res) => {
    try {
        const { user_id, role } = req.query;
        let whereClause = {};
        
        if (role === 'admin' && user_id) {
            whereClause.created_by = user_id;
        }

        const suppliers = await Supplier.findAll({ 
            where: whereClause,
            order: [['id', 'DESC']] 
        });
        res.json(suppliers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch suppliers" });
    }
};

// 2. CREATE SUPPLIER
exports.createSupplier = async (req, res) => {
    try {
        const newSupplier = await Supplier.create(req.body);
        res.status(201).json(newSupplier);
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: "Mobile number already exists" });
        }
        res.status(500).json({ error: "Failed to create supplier" });
    }
};

// 3. UPDATE SUPPLIER (This was missing!)
exports.updateSupplier = async (req, res) => {
    try {
        const [updated] = await Supplier.update(req.body, { where: { id: req.params.id } });
        if (updated) {
            const updatedSupplier = await Supplier.findByPk(req.params.id);
            res.status(200).json(updatedSupplier);
        } else {
            res.status(404).json({ error: "Supplier not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update supplier" });
    }
};

// 4. DELETE SUPPLIER (This was missing!)
exports.deleteSupplier = async (req, res) => {
    try {
        const deleted = await Supplier.destroy({ where: { id: req.params.id } });
        if (deleted) {
            res.status(200).json({ message: "Supplier deleted" });
        } else {
            res.status(404).json({ error: "Supplier not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to delete supplier" });
    }
};