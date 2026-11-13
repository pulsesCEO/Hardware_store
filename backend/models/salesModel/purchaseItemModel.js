const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const PurchaseItem = sequelize.define('PurchaseItem', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    purchase_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    quantity: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    cost_price: { type: DataTypes.DECIMAL(10, 2), allowNull: false }
}, { tableName: 'purchase_items', timestamps: false });

// 👇 NO ASSOCIATIONS HERE! Just export the model.
module.exports = PurchaseItem;