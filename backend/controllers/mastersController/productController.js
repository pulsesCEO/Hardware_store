const Product = require('../../models/mastersModel/productModel');
const Unit = require('../../models/unitModel'); 
const Gst = require('../../models/mastersModel/gstModel');
const User = require('../../models/userModel'); 
const getAllowedUserIds = require('../../utils/getAllowedUserIds');
const { Op } = require('sequelize');

exports.getAllProducts = async (req, res) => {
    try {
        const { user_id, role } = req.query;
        let whereClause = {};
        
        const allowedIds = await getAllowedUserIds(user_id, role);
        if (allowedIds) {
            whereClause.created_by = { [Op.in]: allowedIds };
        }

        const products = await Product.findAll({ 
            where: whereClause,
            include: [
                { model: Unit, as: 'unit' },
                { model: Gst, as: 'gst' },
                { model: User, as: 'creator', attributes: ['name'] } 
            ],
            order: [['id', 'DESC']] 
        });
        res.json(products);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ error: "Failed to fetch products" }); 
    }
};

// ... (Keep your createProduct, updateProduct, and deleteProduct exactly as they are)
exports.createProduct = async (req, res) => {
    try {
        const { sku, created_by } = req.body;
        const existingProduct = await Product.findOne({ where: { sku: sku, created_by: created_by } });
        if (existingProduct) {
            return res.status(400).json({ error: "You already have a product with this SKU." });
        }
        const newProduct = await Product.create(req.body);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create product" });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const [updated] = await Product.update(req.body, { where: { id: req.params.id } });
        if (updated) {
            const updatedProduct = await Product.findByPk(req.params.id);
            res.status(200).json(updatedProduct);
        } else {
            res.status(404).json({ error: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to update product" });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const deleted = await Product.destroy({ where: { id: req.params.id } });
        if (deleted) {
            res.status(200).json({ message: "Product deleted" });
        } else {
            res.status(404).json({ error: "Product not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Failed to delete product" });
    }
};