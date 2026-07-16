'use strict';
const { DataTypes } = require('sequelize');

/**
 * Installment Model
 * Tracks individual installment payments for student enrollments.
 * Status auto-transitions to OVERDUE via nightly cron job.
 */
module.exports = (sequelize) => {
    const Installment = sequelize.define('Installment', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        student_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Students',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        enrollment_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Enrollments',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: {
                    args: [0.01],
                    msg: 'Amount must be greater than zero'
                }
            }
        },
        due_date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        paid_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
            defaultValue: null
        },
        status: {
            type: DataTypes.ENUM('PENDING', 'PAID', 'OVERDUE'),
            defaultValue: 'PENDING',
            allowNull: false
        }
    }, {
        tableName: 'Installments',
        timestamps: true,
        indexes: [
            { fields: ['student_id'] },
            { fields: ['enrollment_id'] },
            { fields: ['status', 'due_date'] }   // optimizes the nightly overdue check
        ]
    });

    // ─── Associations ─────────────────────────────────────────────────────────
    Installment.associate = (models) => {
        Installment.belongsTo(models.Student, {
            foreignKey: 'student_id',
            as: 'student',
            onDelete: 'CASCADE'
        });
        Installment.belongsTo(models.Enrollment, {
            foreignKey: 'enrollment_id',
            as: 'enrollment',
            onDelete: 'CASCADE'
        });
    };

    return Installment;
};
