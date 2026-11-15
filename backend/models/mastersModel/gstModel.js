const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Gst = sequelize.define('Gst', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    tax_name: { type: DataTypes.STRING, allowNull: false }, // e.g. "GST 18%"
    tax_rate: { type: DataTypes.DECIMAL(5, 2), allowNull: false }, // e.g. 18.00
    hsn_code: { type: DataTypes.STRING, allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true } // e.g. "2523"
}, { tableName: 'gst_masters', timestamps: true });

module.exports = Gst;