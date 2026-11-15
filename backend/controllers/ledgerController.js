const Customer = require('../models/mastersModel/customerModel');
const Supplier = require('../models/mastersModel/supplierModel');
const Ledger = require('../models/ledgerModel');
const getAllowedUserIds = require('../utils/getAllowedUserIds');
const { Op } = require('sequelize');

// 1. Fetch all data for the Ledger page

// exports.getLedgerData = async (req, res) => {
//     try {
//         // 1. Get query parameters (filters AND user info)
//         const { from, to, search, user_id, role } = req.query;

//         // 2. Build the base filter for Customers and Suppliers
//         let userFilter = {};
//         if (role === 'admin' && user_id) {
//             userFilter.created_by = user_id;
//         }

//         // 3. Fetch Debtors and Creditors (with user filter applied)
//         const debtors = await Customer.findAll({ 
//             where: { 
//                 outstanding_balance: { [Op.gt]: 0 },
//                 ...userFilter // <-- Only shows their own customers
//             }, 
//             order: [['outstanding_balance', 'DESC']] 
//         });

//         const creditors = await Supplier.findAll({ 
//             where: { 
//                 outstanding_balance: { [Op.gt]: 0 },
//                 ...userFilter // <-- Only shows their own suppliers
//             }, 
//             order: [['outstanding_balance', 'DESC']] 
//         });

//         // 4. Build the Daybook Filter
//         let daybookWhere = {};
//         if (from && to) {
//             daybookWhere.createdAt = { [Op.between]: [new Date(`${from}T00:00:00.000Z`), new Date(`${to}T23:59:59.999Z`)] };
//         }
//         if (search) {
//             daybookWhere.description = { [Op.iLike]: `%${search}%` }; 
//         }

//         // 5. Fetch Daybook
//         const daybook = await Ledger.findAll({
//             where: daybookWhere,
//             order: [['id', 'DESC']],
//             limit: 100 
//         });

//         res.json({ debtors, creditors, daybook });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Failed to fetch ledger data" });
//     }
// };

// exports.getLedgerData = async (req, res) => {
//     try {
//         const { from, to, search, user_id, role } = req.query;

//         // 1. Filter Customers & Suppliers
//         let userFilter = {};
//         if (role === 'admin' && user_id) {
//             userFilter.created_by = user_id;
//         }

//         const debtors = await Customer.findAll({ where: { outstanding_balance: { [Op.gt]: 0 }, ...userFilter }, order: [['outstanding_balance', 'DESC']] });
//         const creditors = await Supplier.findAll({ where: { outstanding_balance: { [Op.gt]: 0 }, ...userFilter }, order: [['outstanding_balance', 'DESC']] });

//         // 2. Build Daybook Filter
//         let daybookWhere = {};
        
//         if (from && to) {
//             daybookWhere.createdAt = { [Op.between]: [new Date(`${from}T00:00:00.000Z`), new Date(`${to}T23:59:59.999Z`)] };
//         }
//         if (search) {
//             daybookWhere.description = { [Op.iLike]: `%${search}%` }; 
//         }

//         // 👇 THE MAGIC FILTER (using created_by) 👇
//         // If the user is an Admin, only show ledger entries where created_by matches their ID
//         if (role === 'admin' && user_id) {
//             daybookWhere.created_by = user_id;
//         }
//         // 👆 If role is 'super_admin', this block is skipped, so Sir sees everything 👆

//         // 3. Fetch Daybook
//         const daybook = await Ledger.findAll({
//             where: daybookWhere,
//             order: [['id', 'DESC']],
//             limit: 100 
//         });

//         res.json({ debtors, creditors, daybook });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: "Failed to fetch ledger data" });
//     }
// };
exports.getLedgerData = async (req, res) => {
    try {
        const { from, to, search, user_id, role } = req.query;

        // Get the list of allowed IDs
        const allowedIds = await getAllowedUserIds(user_id, role);

        // Build filter for Customers & Suppliers
        let userFilter = {};
        if (allowedIds) {
            userFilter.created_by = { [Op.in]: allowedIds };
        }

        const debtors = await Customer.findAll({ where: { outstanding_balance: { [Op.gt]: 0 }, ...userFilter }, order: [['outstanding_balance', 'DESC']] });
        const creditors = await Supplier.findAll({ where: { outstanding_balance: { [Op.gt]: 0 }, ...userFilter }, order: [['outstanding_balance', 'DESC']] });

        // Build Daybook Filter
        let daybookWhere = {};
        if (from && to) {
            daybookWhere.createdAt = { [Op.between]: [new Date(`${from}T00:00:00.000Z`), new Date(`${to}T23:59:59.999Z`)] };
        }
        if (search) {
            daybookWhere.description = { [Op.iLike]: `%${search}%` }; 
        }

        // Apply the allowed IDs filter to the Daybook
        if (allowedIds) {
            daybookWhere.created_by = { [Op.in]: allowedIds };
        }

        const daybook = await Ledger.findAll({
            where: daybookWhere,
            order: [['id', 'DESC']],
            limit: 100 
        });

        res.json({ debtors, creditors, daybook });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to fetch ledger data" });
    }
};

// 2. Collect Payment from Customer (Cash INFLOW)
exports.collectPayment = async (req, res) => {
    try {
        const { customer_id, amount } = req.body;
        const customer = await Customer.findByPk(customer_id);

        if (!customer) return res.status(404).json({ error: "Customer not found" });
        if (amount > customer.outstanding_balance) {
            return res.status(400).json({ error: "Amount exceeds outstanding balance" });
        }

        // Decrease customer balance
        await customer.decrement('outstanding_balance', { by: amount });

        // Add to General Ledger
        await Ledger.create({
            description: `Payment collected from ${customer.name}`,
            type: 'INFLOW',
            amount: amount,
            reference_id: `CUST-${customer.id}`,
              customer_id: customer.id ,
               created_by: req.body.user_id
        });

        res.json({ message: "Payment collected successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to collect payment" });
    }
};

// 3. Pay Supplier (Cash OUTFLOW)
exports.paySupplier = async (req, res) => {
    try {
        const { supplier_id, amount } = req.body;
        const supplier = await Supplier.findByPk(supplier_id);

        if (!supplier) return res.status(404).json({ error: "Supplier not found" });
        if (amount > supplier.outstanding_balance) {
            return res.status(400).json({ error: "Amount exceeds payable balance" });
        }

        // Decrease supplier balance
        await supplier.decrement('outstanding_balance', { by: amount });

        // Add to General Ledger
        await Ledger.create({
            description: `Payment made to ${supplier.company_name}`,
            type: 'OUTFLOW',
            amount: amount,
            reference_id: `SUPP-${supplier.id}`,
             created_by: req.body.user_id 
        });

        res.json({ message: "Supplier paid successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to pay supplier" });
    }
};