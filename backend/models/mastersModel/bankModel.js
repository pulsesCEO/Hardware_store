const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Bank = sequelize.define('Bank', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    bank_name: { type: DataTypes.STRING, allowNull: false },
    account_number: { type: DataTypes.STRING, allowNull: false, unique: true },
    ifsc_code: { type: DataTypes.STRING, allowNull: false },
    branch_name: { type: DataTypes.STRING, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true }
}, { tableName: 'banks', timestamps: true });

module.exports = Bank;