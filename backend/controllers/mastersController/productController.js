const Product = require('../../models/mastersModel/productModel');
const Unit = require('../../models/unitModel'); // <-- CHANGE THIS LINE (remove mastersModel)
const Gst = require('../../models/mastersModel/gstModel');
const User = require('../../models/userModel'); // <-- ADD THIS LINE


// 1. GET ALL PRODUCTS (Filtered by Admin)
exports.getAllProducts = async (req, res) => {
    try {
        const { user_id, role } = req.query;
        let whereClause = {};
        
        if (role === 'admin' && user_id) {
            whereClause.created_by = user_id;
        }

        const products = await Product.findAll({ 
            where: whereClause,
            include: [
                { model: Unit, as: 'unit' },
                { model: Gst, as: 'gst' },
                { model: User, as: 'creator', attributes: ['name'] } // <-- Include Creator Name
            ],
            order: [['id', 'DESC']] 
        });
        res.json(products);
    } catch (error) { 
        console.error(error);
        res.status(500).json({ error: "Failed to fetch products" }); 
    }
};

// 2. CREATE PRODUCT
exports.createProduct = async (req, res) => {
    try {
        const { sku, created_by } = req.body;

        // Check if THIS admin already has a product with this SKU
        const existingProduct = await Product.findOne({ 
            where: { sku: sku, created_by: created_by } 
        });

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

// 3. UPDATE PRODUCT
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

// 4. DELETE PRODUCT
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