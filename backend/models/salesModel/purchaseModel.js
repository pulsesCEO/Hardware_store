const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Purchase = sequelize.define('Purchase', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    purchase_no: { type: DataTypes.STRING, unique: true },
    supplier_id: { type: DataTypes.INTEGER, allowNull: false },
    total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    payment_status: { type: DataTypes.STRING, defaultValue: 'Paid' } 
}, { tableName: 'purchases', timestamps: true });

// 👇 NO ASSOCIATIONS HERE! Just export the model.
module.exports = Purchase;