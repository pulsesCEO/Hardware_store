const Inventory = require('../models/inventoryModel');

// 1. Get all inventory items
exports.getInventory = async (req, res) => {
    try {
        const items = await Inventory.findAll({ order: [['id', 'DESC']] });
        res.json(items);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch inventory items" });
    }
};

// 2. Add a new inventory item
exports.addInventoryItem = async (req, res) => {
    try {
        const { name, unit, cost_price, selling_price, current_stock } = req.body;
        
        // Auto-generate SKU (e.g., INV-001)
        const count = await Inventory.count();
        const sku = `INV-${String(count + 1).padStart(3, '0')}`;

        const newItem = await Inventory.create({
            name, unit, cost_price, selling_price, current_stock, sku
        });
        res.status(201).json(newItem);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to add inventory item" });
    }
};