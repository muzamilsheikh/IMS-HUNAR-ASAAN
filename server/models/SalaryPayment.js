'use strict';
const { DataTypes } = require('sequelize');

/**
 * SalaryPayment Model
 * Tracks monthly salary disbursements for staff members.
 * Enforces one salary record per staff member per month via composite unique index.
 */
module.exports = (sequelize) => {
    const SalaryPayment = sequelize.define('SalaryPayment', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        staff_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        month_year: {
            type: DataTypes.STRING(7),
            allowNull: false,
            comment: 'Format: MM-YYYY — e.g. 06-2025',
            validate: {
                is: {
                    args: /^\d{2}-\d{4}$/,
                    msg: 'month_year must be in MM-YYYY format'
                }
            }
        },
        base_pay: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: {
                    args: [0],
                    msg: 'base_pay must be a positive value'
                }
            }
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'PAID'),
            defaultValue: 'PENDING',
            allowNull: false
        },
        disbursal_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            defaultValue: null
        }
    }, {
        tableName: 'SalaryPayments',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['staff_id', 'month_year'],
                name: 'unique_staff_month_salary'
            }
        ]
    });

    // ─── Associations ─────────────────────────────────────────────────────────
    SalaryPayment.associate = (models) => {
        SalaryPayment.belongsTo(models.User, {
            foreignKey: 'staff_id',
            as: 'staff',
            onDelete: 'CASCADE'
        });
    };

    return SalaryPayment;
};
