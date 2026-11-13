const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database'); // Notice the ../../

const Customer = sequelize.define('Customer', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    mobile: { type: DataTypes.STRING, allowNull: false, unique: true },
    email: { type: DataTypes.STRING, allowNull: true },   
    gstin: { type: DataTypes.STRING, allowNull: true },   
    address: { type: DataTypes.TEXT, allowNull: true },   
    credit_limit: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
    outstanding_balance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 }
}, { tableName: 'customers', timestamps: true });

module.exports = Customer;