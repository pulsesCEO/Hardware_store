const seedUsers = require('./seeders/userSeeder');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const sequelize = require('./config/database'); 

// 1. ROUTES
const settingsRoutes = require('./routes/settingsRoutes');  
const unitRoutes = require('./routes/unitRoutes'); 
const customerRoutes = require('./routes/mastersRoutes/customerRoutes'); 
const supplierRoutes = require('./routes/mastersRoutes/supplierRoutes');
const productRoutes = require('./routes/mastersRoutes/productRoutes');
const gstRoutes = require('./routes/mastersRoutes/gstRoutes');
const bankRoutes = require('./routes/mastersRoutes/bankRoutes'); 
const authRoutes = require('./routes/authRoutes');
const salesRoutes = require('./routes/salesRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes'); 
const purchaseRoutes = require('./routes/purchaseRoutes');

// 2. MODELS (For Relationships)
const Product = require('./models/mastersModel/productModel');
const Unit = require('./models/unitModel');
const Gst = require('./models/mastersModel/gstModel');
const Supplier = require('./models/mastersModel/supplierModel');
const Purchase = require('./models/salesModel/purchaseModel');
const PurchaseItem = require('./models/salesModel/purchaseItemModel');
const ledgerRoutes = require('./routes/ledgerRoutes');
const User = require('./models/userModel');
// ==========================================
// 👇 3. DATABASE RELATIONSHIPS (Centralized)
// ==========================================
Product.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Product.belongsTo(Gst, { foreignKey: 'gst_id', as: 'gst' });
Purchase.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Purchase.hasMany(PurchaseItem, { foreignKey: 'purchase_id', as: 'items' });
PurchaseItem.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

const app = express();

// ==========================================
// PKG FIX
// ==========================================
const isPkg = typeof process.pkg !== 'undefined';
const baseDir = isPkg ? path.dirname(process.execPath) : __dirname;

const uploadsDir = path.join(baseDir, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 Created uploads folder at: ${uploadsDir}`);
}

// MIDDLEWARE
app.use(cors()); 
app.use(express.json()); 
app.use('/uploads', express.static(uploadsDir)); 

// ROUTES USAGE
app.use('/api/masters/units', unitRoutes); 
app.use('/api/masters/customers', customerRoutes);
app.use('/api/masters/suppliers', supplierRoutes);
app.use('/api/masters/products', productRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/masters/gst', gstRoutes);
app.use('/api/masters/banks', bankRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/auth', authRoutes); 
app.use('/api/inventory', inventoryRoutes); 
app.use('/api/purchases', purchaseRoutes);
app.use('/api/ledgers', ledgerRoutes);

app.get('/api/health', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.json({ message: "Backend is running!" });
    } catch (error) {
        res.status(500).json({ error: "Database connection failed." });
    }
});

const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: false }).then(async () => { 
    console.log('✅ Database connected and models synced.'); 
    await seedUsers();

    app.use(express.static(path.join(baseDir, 'public')));
    app.get(/.*/, (req, res) => {
        if (!req.url.startsWith('/api')) {
            res.sendFile(path.join(baseDir, 'public', 'index.html'));
        } 
        else {
            // 👇 ADD THIS ELSE BLOCK
            res.status(404).json({ error: "API route not found" });
        }
    });

    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
}).catch(err => {
    console.error('❌ Failed to sync database:', err);
});