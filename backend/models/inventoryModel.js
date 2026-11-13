const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    sku: { type: DataTypes.STRING, unique: true }, 
    unit: { type: DataTypes.STRING, allowNull: false }, 
    cost_price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    selling_price: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    current_stock: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 }
}, { tableName: 'inventory_items', timestamps: true });

module.exports = Inventory;