'use strict';

const { SalaryPayment, User } = require('../models');

/**
 * payrollController
 *
 * All endpoints use the unified SalaryPayment schema:
 *   staff_id, month_year (MM-YYYY), base_pay, status, disbursal_date
 *
 * The /api/payroll routes are kept for backwards-compatibility with the
 * existing Payroll page. The new /api/salaries routes (markSalaryPaid,
 * getSalaryReport) live in paymentController.js.
 */

// Create or update a salary payment record (Admin only)
const createOrUpdatePayroll = async (req, res) => {
    try {
        // Accept both old camelCase keys (from Payroll page) and new snake_case keys
        const {
            staffId,   staff_id,
            month,     month_year,
            basePay,   base_pay,
            status,
            disbursalDate, disbursal_date
        } = req.body;

        const resolvedStaffId   = staff_id   || staffId;
        const resolvedMonthYear = month_year || month;
        const resolvedBasePay   = base_pay   || basePay;
        const resolvedDisbursal = disbursal_date || disbursalDate;

        if (!resolvedStaffId || !resolvedMonthYear || resolvedBasePay === undefined) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['staffId / staff_id', 'month / month_year', 'basePay / base_pay']
            });
        }

        // Verify that the staff user exists
        const staffUser = await User.findByPk(resolvedStaffId);
        if (!staffUser) {
            return res.status(404).json({ error: 'Staff member not found' });
        }

        // Find existing payroll record for this staff and month
        let payment = await SalaryPayment.findOne({
            where: { staff_id: resolvedStaffId, month_year: resolvedMonthYear }
        });

        if (payment) {
            // Update existing record
            await payment.update({
                base_pay:      parseFloat(resolvedBasePay),
                status:        status || 'PENDING',
                disbursal_date: status === 'PAID'
                    ? (resolvedDisbursal || new Date().toISOString().split('T')[0])
                    : null
            });
        } else {
            // Create new record
            payment = await SalaryPayment.create({
                staff_id:      resolvedStaffId,
                month_year:    resolvedMonthYear,
                base_pay:      parseFloat(resolvedBasePay),
                status:        status || 'PENDING',
                disbursal_date: status === 'PAID'
                    ? (resolvedDisbursal || new Date().toISOString().split('T')[0])
                    : null
            });
        }

        res.status(201).json({
            success: true,
            message: 'Payroll record saved successfully',
            payment
        });
    } catch (error) {
        console.error('Create or update payroll error:', error);
        res.status(500).json({ error: error.message || 'Server error' });
    }
};

// Get the logged-in staff member's own payroll history
const getMyPayroll = async (req, res) => {
    try {
        const staffId = req.user.id;
        const payments = await SalaryPayment.findAll({
            where: { staff_id: staffId },
            order: [['month_year', 'DESC']]
        });
        res.json(payments || []);
    } catch (error) {
        console.error('Get my payroll error:', error);
        res.status(500).json({ error: error.message || 'Server error', payments: [] });
    }
};

// Get a specific staff member's payroll history (Admin only)
const getStaffPayroll = async (req, res) => {
    try {
        const { staffId } = req.params;
        const payments = await SalaryPayment.findAll({
            where: { staff_id: staffId },
            order: [['month_year', 'DESC']]
        });
        res.json(payments || []);
    } catch (error) {
        console.error('Get staff payroll error:', error);
        res.status(500).json({ error: error.message || 'Server error', payments: [] });
    }
};

module.exports = {
    createOrUpdatePayroll,
    getMyPayroll,
    getStaffPayroll
};
