const sequelize = require('../config/database');
const Purchase = require('../models/salesModel/purchaseModel');
const PurchaseItem = require('../models/salesModel/purchaseItemModel');
const Product = require('../models/mastersModel/productModel');
const Supplier = require('../models/mastersModel/supplierModel');
const Unit = require('../models/unitModel');  
const Ledger = require('../models/ledgerModel');

// exports.createPurchase = async (req, res) => {
//     const t = await sequelize.transaction();

//     try {
//         const { supplier_id, items, total_amount, payment_status } = req.body;
//         const purchase_no = 'PUR-' + Date.now().toString().slice(-6);

//         // 1. Create Purchase Header
//         const newPurchase = await Purchase.create({
//             purchase_no,
//             supplier_id,
//             total_amount,
//             payment_status
//         }, { transaction: t });

//         // 2. Loop through items
//         for (let item of items) {
//             await PurchaseItem.create({
//                 purchase_id: newPurchase.id,
//                 product_id: item.product_id,
//                 quantity: item.quantity,
//                 cost_price: item.cost_price
//             }, { transaction: t });

//             // 👇 THE MAGIC: INCREMENT STOCK (Add to existing stock)
//             await Product.increment('stock_level', {
//                 by: item.quantity,
//                 where: { id: item.product_id },
//                 transaction: t
//             });
//         }

//         // 3. If on Credit, increase what we owe the Supplier
//         if (payment_status === 'Credit') {
//             await Supplier.increment('outstanding_balance', {
//                 by: total_amount,
//                 where: { id: supplier_id },
//                 transaction: t
//             });
//         }

//         await t.commit();
//         res.status(201).json({ message: "Purchase saved successfully!", purchase_no });

//     } catch (error) {
//         await t.rollback();
//         console.error("PURCHASE ERROR:", error);
//         res.status(500).json({ error: "Failed to save purchase." });
//     }
// }; 

// exports.createPurchase = async (req, res) => {
//     const t = await sequelize.transaction();

//     try {
//         const { supplier_id, items, payment_mode, sub_total, tax_amount, total_amount } = req.body;

//         const purchase_no = 'PUR-' + Date.now().toString().slice(-6);
//         const isCredit = payment_mode === 'Supplier Credit';
//    const supplier = await Supplier.findByPk(supplier_id);
//         const supplierName = supplier ? supplier.company_name : 'Unknown Supplier';
//         const newPurchase = await Purchase.create({
//             purchase_no,
//             supplier_id,
//             sub_total,
//             tax_amount,
//             total_amount,
//             payment_mode,
//             status: isCredit ? 'Unpaid' : 'Paid' // If cash, it's instantly Paid
//         }, { transaction: t });

//         for (let item of items) {
//             await PurchaseItem.create({
//                 purchase_id: newPurchase.id,
//                 product_id: item.product_id,
//                 quantity: item.quantity,
//                 cost_price: item.cost_price,
//                 total_price: (item.quantity * item.cost_price)
//             }, { transaction: t });

//             await Product.increment('stock_level', {
//                 by: item.quantity,
//                 where: { id: item.product_id },
//                 transaction: t
//             });
//         }

//         // --- THE FIX ---
//         if (isCredit && supplier_id) {
//             // 1. If Credit, we OWE them. Add to Sundry Creditors.
//             await Supplier.increment('outstanding_balance', {
//                 by: total_amount,
//                 where: { id: supplier_id },
//                 transaction: t
//             });
            
//             // 2. We do NOT log an OUTFLOW in the ledger yet, because no cash left the drawer!
            
//         } else {
//             // 1. If Cash, we paid them immediately. 
//             // 2. Log the OUTFLOW in the ledger right now.
//             await Ledger.create({
//                 // description: `Cash Purchase - ${items.length} items (${purchase_no})`,
//                  description: `Purchase from ${supplierName} (${purchase_no})`,
//                 type: 'OUTFLOW',
//                 amount: total_amount,
//                 reference_id: purchase_no,
//                   created_by: req.body.user_id 
//             }, { transaction: t });
//         }

//         await t.commit();
//         res.status(201).json({ message: "Purchase saved successfully!", purchase_no, id: newPurchase.id });

//     } catch (error) {
//         await t.rollback();
//         console.error("PURCHASE ERROR:", error);
//         res.status(500).json({ error: "Failed to process purchase. " + error.message });
//     }
// };


exports.createPurchase = async (req, res) => {
    const t = await sequelize.transaction();

    try {
        const { supplier_id, items, payment_mode, sub_total, tax_amount, total_amount, user_id } = req.body;

        const purchase_no = 'PUR-' + Date.now().toString().slice(-6);
        const isCredit = payment_mode === 'Supplier Credit';

        // 1. Create the Purchase record
        const newPurchase = await Purchase.create({
            purchase_no,
            supplier_id,
            sub_total,
            tax_amount,
            total_amount,
            payment_mode,
            status: isCredit ? 'Unpaid' : 'Paid' 
        }, { transaction: t });

        // 2. Save items and increase stock
        for (let item of items) {
            await PurchaseItem.create({
                purchase_id: newPurchase.id,
                product_id: item.product_id,
                quantity: item.quantity,
                cost_price: item.cost_price,
                total_price: (item.quantity * item.cost_price)
            }, { transaction: t });

            await Product.increment('stock_level', {
                by: item.quantity,
                where: { id: item.product_id },
                transaction: t
            });
        }

        // Fetch supplier name for the ledger
        const supplier = await Supplier.findByPk(supplier_id);
        const supplierName = supplier ? supplier.company_name : 'Unknown Supplier';

        // 3. ACCOUNTING LOGIC
        if (isCredit) {
            // --- IF CREDIT (Checked) ---
            // We OWE them. Add to Sundry Creditors. DO NOT touch the General Ledger yet.
            await Supplier.increment('outstanding_balance', {
                by: total_amount,
                where: { id: supplier_id },
                transaction: t
            });
            
        } else {
            // --- IF CASH (Unchecked) ---
            // We paid immediately. DO NOT add to creditors. Record the OUTFLOW in the General Ledger.
            await Ledger.create({
                description: `Cash Purchase from ${supplierName} (${purchase_no})`,
                type: 'OUTFLOW',
                amount: total_amount,
                reference_id: purchase_no,
                created_by: user_id
            }, { transaction: t });
        }

        await t.commit();
        res.status(201).json({ message: "Purchase saved successfully!", purchase_no, id: newPurchase.id });

    } catch (error) {
        await t.rollback();
        console.error("PURCHASE ERROR:", error);
        res.status(500).json({ error: "Failed to process purchase. " + error.message });
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