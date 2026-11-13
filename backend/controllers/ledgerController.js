const Customer = require('../models/mastersModel/customerModel');
const Supplier = require('../models/mastersModel/supplierModel');
const Ledger = require('../models/ledgerModel');
const { Op } = require('sequelize');

// 1. Fetch all data for the Ledger page
exports.getLedgerData = async (req, res) => {
    try {
        // Get customers with outstanding balance > 0
        const debtors = await Customer.findAll({
            where: { outstanding_balance: { [Op.gt]: 0 } },
            order: [['outstanding_balance', 'DESC']]
        });

        // Get suppliers with outstanding balance > 0
        const creditors = await Supplier.findAll({
            where: { outstanding_balance: { [Op.gt]: 0 } },
            order: [['outstanding_balance', 'DESC']]
        });

        // Get the general daybook (recent 50 entries)
        const daybook = await Ledger.findAll({
            order: [['id', 'DESC']],
            limit: 50
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
            reference_id: `CUST-${customer.id}`
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
            reference_id: `SUPP-${supplier.id}`
        });

        res.json({ message: "Supplier paid successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to pay supplier" });
    }
};