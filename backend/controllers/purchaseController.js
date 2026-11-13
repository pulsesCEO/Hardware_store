const sequelize = require('../config/database');
const Purchase = require('../models/salesModel/purchaseModel');
const PurchaseItem = require('../models/salesModel/purchaseItemModel');
const Product = require('../models/mastersModel/productModel');
const Supplier = require('../models/mastersModel/supplierModel');
const Unit = require('../models/unitModel');  

exports.createPurchase = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { supplier_id, items, total_amount, payment_status } = req.body;
        const purchase_no = 'PUR-' + Date.now().toString().slice(-6);

        // 1. Create Purchase Header
        const newPurchase = await Purchase.create({
            purchase_no,
            supplier_id,
            total_amount,
            payment_status
        }, { transaction: t });

        // 2. Loop through items
        for (let item of items) {
            await PurchaseItem.create({
                purchase_id: newPurchase.id,
                product_id: item.product_id,
                quantity: item.quantity,
                cost_price: item.cost_price
            }, { transaction: t });

            // 👇 THE MAGIC: INCREMENT STOCK (Add to existing stock)
            await Product.increment('stock_level', {
                by: item.quantity,
                where: { id: item.product_id },
                transaction: t
            });
        }

        // 3. If on Credit, increase what we owe the Supplier
        if (payment_status === 'Credit') {
            await Supplier.increment('outstanding_balance', {
                by: total_amount,
                where: { id: supplier_id },
                transaction: t
            });
        }

        await t.commit();
        res.status(201).json({ message: "Purchase saved successfully!", purchase_no });

    } catch (error) {
        await t.rollback();
        console.error("PURCHASE ERROR:", error);
        res.status(500).json({ error: "Failed to save purchase." });
    }
}; 


exports.getAllPurchases = async (req, res) => {
    try {
        const purchases = await Purchase.findAll({
            include: [
                { 
                    model: Supplier, 
                    as: 'supplier', 
                    attributes: ['company_name'] 
                },
                { 
                    model: PurchaseItem, 
                    as: 'items',
                    include: [
                        { 
                            model: Product, 
                            as: 'product', 
                            attributes: ['name'], // 👈 Removed 'unit' from here
                            include: [
                                // 👇 Added Unit model here to get the unit name
                                { model: Unit, as: 'unit', attributes: ['name'] } 
                            ]
                        }
                    ]
                }
            ],
            order: [['id', 'DESC']]
        });
        res.json(purchases);
    } catch (error) {
        console.error("GET PURCHASES ERROR:", error);
        res.status(500).json({ error: "Failed to fetch purchase history" });
    }
};