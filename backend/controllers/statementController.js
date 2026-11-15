const Invoice = require('../models/salesModel/invoiceModel');
const Purchase = require('../models/salesModel/purchaseModel');
const Ledger = require('../models/ledgerModel');
const { Op } = require('sequelize');

// 1. CUSTOMER STATEMENT (Sundry Debtors)
exports.getCustomerStatement = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { from, to } = req.query;

        // Safer Date Range (Start of day to End of day in UTC)
        const startDate = new Date(`${from}T00:00:00.000Z`);
        const endDate = new Date(`${to}T23:59:59.999Z`);

        // Fetch Invoices (Debits)
        const invoices = await Invoice.findAll({
            where: {
                customer_id: parseInt(customerId),
                status: 'Unpaid', 
                createdAt: { [Op.between]: [startDate, endDate] }
            }
        });

        // Fetch Payments (Credits)
        const payments = await Ledger.findAll({
            where: {
                customer_id: parseInt(customerId),
                description: { [Op.like]: 'Payment collected%' },
                createdAt: { [Op.between]: [startDate, endDate] }
            }
        });

        let transactions = [];
        invoices.forEach(inv => transactions.push({ date: inv.createdAt, reference: inv.invoice_no, particulars: 'Sale Invoice', debit: Number(inv.total_amount), credit: 0 }));
        payments.forEach(pay => transactions.push({ date: pay.createdAt, reference: pay.reference_id, particulars: 'Payment Received', debit: 0, credit: Number(pay.amount) }));

        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        let totalDebit = 0, totalCredit = 0, runningBalance = 0;
        transactions = transactions.map(t => {
            totalDebit += t.debit;
            totalCredit += t.credit;
            runningBalance += (t.debit - t.credit);
            return { ...t, balance: runningBalance };
        });

        res.json({ totalDebit, totalCredit, grandTotal: runningBalance, transactions });
    } catch (error) {
        console.error("Customer Statement Error:", error);
        res.status(500).json({ error: "Failed to fetch customer statement" });
    }
};

// 2. SUPPLIER STATEMENT (Sundry Creditors)
exports.getSupplierStatement = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const { from, to } = req.query;

        const startDate = new Date(`${from}T00:00:00.000Z`);
        const endDate = new Date(`${to}T23:59:59.999Z`);

        // Fetch Purchases (Debits - Money we owe)
        const purchases = await Purchase.findAll({
            where: {
                supplier_id: parseInt(supplierId),
                createdAt: { [Op.between]: [startDate, endDate] }
            }
        });

        // Fetch Payments (Credits - Money we paid)
        const payments = await Ledger.findAll({
            where: {
                reference_id: `SUPP-${supplierId}`, 
                description: { [Op.like]: 'Payment made to%' },
                createdAt: { [Op.between]: [startDate, endDate] }
            }
        });

        // Debug Logs (Check your VS Code terminal when you load the page)
        console.log(`📊 Supplier Statement for ID: ${supplierId}`);
        console.log(`📅 Date Range: ${from} to ${to}`);
        console.log(`📦 Purchases Found: ${purchases.length}`);
        console.log(`💸 Payments Found: ${payments.length}`);

        let transactions = [];
        purchases.forEach(pur => transactions.push({ date: pur.createdAt, reference: pur.purchase_no, particulars: 'Purchase Invoice', debit: Number(pur.total_amount), credit: 0 }));
        payments.forEach(pay => transactions.push({ date: pay.createdAt, reference: pay.reference_id, particulars: 'Payment Made', debit: 0, credit: Number(pay.amount) }));

        transactions.sort((a, b) => new Date(a.date) - new Date(b.date));

        let totalDebit = 0, totalCredit = 0, runningBalance = 0;
        transactions = transactions.map(t => {
            totalDebit += t.debit;
            totalCredit += t.credit;
            runningBalance += (t.debit - t.credit); 
            return { ...t, balance: runningBalance };
        });

        res.json({ totalDebit, totalCredit, grandTotal: runningBalance, transactions });
    } catch (error) {
        console.error("Supplier Statement Error:", error);
        res.status(500).json({ error: "Failed to fetch supplier statement" });
    }
};