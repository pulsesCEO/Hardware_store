const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Supplier = sequelize.define('Supplier', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    company_name: { type: DataTypes.STRING, allowNull: false },
    contact_person: { type: DataTypes.STRING },
    mobile: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: true },
    gstin: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    outstanding_balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    created_by: { type: DataTypes.INTEGER, allowNull: true },
}, { tableName: 'suppliers', timestamps: true });

module.exports = Supplier;