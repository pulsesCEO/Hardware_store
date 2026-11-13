const sequelize = require('../config/database');
const Invoice = require('../models/salesModel/invoiceModel');
const InvoiceItem = require('../models/salesModel/invoiceItemModel');
const Product = require('../models/mastersModel/productModel');
const Customer = require('../models/mastersModel/customerModel');
const Ledger = require('../models/ledgerModel');
const Settings = require('../models/settingsModel'); 
const User = require('../models/userModel');



exports.createSale = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { customer_id, items, payment_mode, sub_total, tax_amount, total_amount, user_id } = req.body;

        const invoice_no = 'INV-' + Date.now().toString().slice(-6);

        const newInvoice = await Invoice.create({
            invoice_no, customer_id: customer_id || null,
            sub_total, tax_amount, total_amount, payment_mode,
            status: payment_mode === 'Store Credit' ? 'Unpaid' : 'Paid'
        }, { transaction: t });

        // --- BULLETPROOF PERMISSION LOGIC ---
        let isInventoryEnabled = false;

        if (user_id) {
            const user = await User.findByPk(user_id);
            
            if (user) {
                if (user.role === 'super_admin') {
                    isInventoryEnabled = true;
                } else {
                    // 👇 FIXED: USING enabled_modules INSTEAD OF allowed_modules
                    let enabledModules = user.enabled_modules;
                    
                    if (!enabledModules) {
                        enabledModules = [];
                    }
                    if (typeof enabledModules === 'string') {
                        try { enabledModules = JSON.parse(enabledModules); } catch (e) { enabledModules = []; }
                    }
                    
                    isInventoryEnabled = enabledModules.includes('inventory');
                }
            }
        }
        
        console.log(`🛒 SALE by User ${user_id} - Deduct Stock? ${isInventoryEnabled}`);

        for (let item of items) {
            await InvoiceItem.create({
                invoice_id: newInvoice.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total_price: (item.quantity * item.unit_price)
            }, { transaction: t });

            if (isInventoryEnabled) {
                await Product.decrement('stock_level', {
                    by: item.quantity,
                    where: { id: item.product_id },
                    transaction: t
                });
            }
        }

        if (payment_mode === 'Store Credit' && customer_id) {
            await Customer.increment('outstanding_balance', {
                by: total_amount,
                where: { id: customer_id },
                transaction: t
            });
        }

        await Ledger.create({
            description: `Sale - ${items.length} items (${invoice_no})`,
            type: 'INFLOW',
            amount: total_amount,
            reference_id: invoice_no
        }, { transaction: t });

        await t.commit();
        res.status(201).json({ message: "Sale completed successfully!", invoice_no, id: newInvoice.id });

    } catch (error) {
        await t.rollback();
        console.error("SALE ERROR:", error);
        res.status(500).json({ error: "Failed to process sale. " + error.message });
    }
};

exports.getAllSales = async (req, res) => {
    try {
        const sales = await Invoice.findAll({ order: [['id', 'DESC']] });
        res.json(sales);
    } catch (error) { res.status(500).json({ error: "Failed to fetch sales" }); }
};


exports.getAllSales = async (req, res) => {
    try {
        const sales = await Invoice.findAll({ order: [['id', 'DESC']] });
        res.json(sales);
    } catch (error) { res.status(500).json({ error: "Failed to fetch sales" }); }
};