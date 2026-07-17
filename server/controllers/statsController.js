const { Student, Payment, Expense, ActivityLog, User } = require('../models');
const { sequelize } = require('../models');
const { Sequelize } = require('sequelize');

// Helper function to calculate cumulative total paid from Payment table
const calculateCumulativeTotalPaid = async (studentId) => {
    try {
        const result = await Payment.findOne({
            where: { studentId, status: 'Paid' },
            attributes: [
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'totalPaid']
            ],
            raw: true
        });
        return result?.totalPaid || 0;
    } catch (err) {
        console.error('Error calculating cumulative total:', err);
        return 0;
    }
};

// GET /api/stats/financial-dashboard - Main financial dashboard endpoint with filters
const getFinancialDashboardStats = async (req, res) => {
    try {
        const { batchId, courseId, month, year } = req.query;

        // Build where conditions for Student filtering
        const studentWhere = {};
        if (batchId && batchId !== 'all') studentWhere.batchId = parseInt(batchId);
        if (courseId && courseId !== 'all') studentWhere.courseId = parseInt(courseId);

        // Build where conditions for Payment filtering
        const paymentWhere = { status: 'Paid' };
        if (batchId && batchId !== 'all') paymentWhere['$Student.batchId$'] = parseInt(batchId);
        if (courseId && courseId !== 'all') paymentWhere['$Student.courseId$'] = parseInt(courseId);

        // Date calculations for monthly/yearly filters
        let startDate, endDate;
        if (year && year !== 'all') {
            const y = parseInt(year);
            if (month && month !== 'all') {
                const m = parseInt(month) - 1; // 0-indexed
                startDate = new Date(y, m, 1);
                endDate = new Date(y, m + 1, 0, 23, 59, 59, 999);
            } else {
                startDate = new Date(y, 0, 1);
                endDate = new Date(y, 11, 31, 23, 59, 59, 999);
            }
        } else if (month && month !== 'all') {
            const currentYear = new Date().getFullYear();
            const m = parseInt(month) - 1;
            startDate = new Date(currentYear, m, 1);
            endDate = new Date(currentYear, m + 1, 0, 23, 59, 59, 999);
        }

        if (startDate && endDate) {
            paymentWhere.paymentDate = { [Sequelize.Op.between]: [startDate, endDate] };
        }

        // 1. Pending fees SQL query with optional batch/course parameters
        let pendingSql = `
            SELECT
                COALESCE(SUM(
                    GREATEST(0,
                        COALESCE(s.totalFee, 0) - COALESCE(s.discount, 0)
                        - COALESCE(p.totalPaid, 0)
                    )
                ), 0) AS totalPending
            FROM Students s
            LEFT JOIN (
                SELECT studentId, SUM(amountPaid) AS totalPaid
                FROM Payments
                WHERE status = 'Paid'
                GROUP BY studentId
            ) p ON p.studentId = s.id
            WHERE 1=1
        `;
        const replacements = {};
        if (batchId && batchId !== 'all') {
            pendingSql += ` AND s.batchId = :batchId`;
            replacements.batchId = parseInt(batchId);
        }
        if (courseId && courseId !== 'all') {
            pendingSql += ` AND s.courseId = :courseId`;
            replacements.courseId = parseInt(courseId);
        }
        
        const pendingResult = await sequelize.query(pendingSql, {
            replacements,
            type: sequelize.QueryTypes.SELECT
        });
        const totalPending = parseFloat(pendingResult[0]?.totalPending || 0);

        // 2. Total revenue (Join with Student model to filter by batch/course)
        const totalRevenueResult = await Payment.findOne({
            attributes: [
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amountPaid')), 0), 'totalRevenue']
            ],
            where: paymentWhere,
            include: [{ model: Student, attributes: [] }],
            raw: true
        });
        const totalRevenue = parseFloat(totalRevenueResult?.totalRevenue || 0);

        // 3. Total expenses (institute-wide, filter only by date)
        const expenseWhere = {};
        if (startDate && endDate) {
            expenseWhere.date = { [Sequelize.Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]] };
        }
        const totalExpensesResult = await Expense.findOne({
            attributes: [
                [Sequelize.fn('COALESCE', Sequelize.fn('SUM', Sequelize.col('amount')), 0), 'totalExpenses']
            ],
            where: expenseWhere,
            raw: true
        });
        const totalExpenses = parseFloat(totalExpensesResult?.totalExpenses || 0);

        const netProfit = totalRevenue - totalExpenses;
        const grossPortfolioValue = totalRevenue + totalPending;

        // 4. Total students
        const totalStudents = await Student.count({ where: studentWhere });

        // 5. Chart data (Historical monthly metrics)
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const revenueByMonth = await sequelize.query(`
            SELECT
                DATE_FORMAT(py.paymentDate, '%b %Y') AS month,
                DATE_FORMAT(py.paymentDate, '%Y-%m') AS sort_key,
                COALESCE(SUM(py.amountPaid), 0) AS revenue
            FROM Payments py
            JOIN Students st ON py.studentId = st.id
            WHERE py.status = 'Paid'
              AND py.paymentDate >= :sixMonthsAgo
              ${batchId && batchId !== 'all' ? 'AND st.batchId = :batchId' : ''}
              ${courseId && courseId !== 'all' ? 'AND st.courseId = :courseId' : ''}
            GROUP BY DATE_FORMAT(py.paymentDate, '%b %Y'), DATE_FORMAT(py.paymentDate, '%Y-%m')
        `, {
            replacements: { 
                sixMonthsAgo: sixMonthsAgo.toISOString().slice(0, 10),
                batchId: batchId ? parseInt(batchId) : null,
                courseId: courseId ? parseInt(courseId) : null
            },
            type: sequelize.QueryTypes.SELECT
        });

        const expensesByMonth = await sequelize.query(`
            SELECT
                DATE_FORMAT(date, '%b %Y') AS month,
                DATE_FORMAT(date, '%Y-%m') AS sort_key,
                COALESCE(SUM(amount), 0) AS expenses
            FROM Expenses
            WHERE date >= :sixMonthsAgo
            GROUP BY DATE_FORMAT(date, '%b %Y'), DATE_FORMAT(date, '%Y-%m')
        `, {
            replacements: { sixMonthsAgo: sixMonthsAgo.toISOString().slice(0, 10) },
            type: sequelize.QueryTypes.SELECT
        });

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const chartData = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const label = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
            const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const revRow = revenueByMonth.find(r => r.sort_key === sortKey);
            const expRow = expensesByMonth.find(e => e.sort_key === sortKey);
            chartData.push({
                month: label,
                revenue: parseFloat(revRow?.revenue || 0),
                expenses: parseFloat(expRow?.expenses || 0)
            });
        }

        res.json({
            success: true,
            data: {
                totalStudents,
                totalPending: Math.round(totalPending * 100) / 100,
                totalRevenue: Math.round(totalRevenue * 100) / 100,
                totalExpenses: Math.round(totalExpenses * 100) / 100,
                netProfit: Math.round(netProfit * 100) / 100,
                grossPortfolioValue: Math.round(grossPortfolioValue * 100) / 100,
                chartData,
                feeDistribution: {
                    collected: Math.round(totalRevenue * 100) / 100,
                    outstanding: Math.round(totalPending * 100) / 100
                }
            }
        });
    } catch (error) {
        console.error('Financial dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Server error'
        });
    }
};

// GET /api/stats/activity - Fetch recent system activity logs
const getActivityLogs = async (req, res) => {
    try {
        const logs = await ActivityLog.findAll({
            include: [{ model: User, as: 'user', attributes: ['id', 'name', 'role'] }],
            order: [['createdAt', 'DESC']],
            limit: 50
        });
        res.json({ success: true, logs });
    } catch (error) {
        console.error('Get activity logs error:', error);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};

module.exports = {
    getFinancialDashboardStats,
    getActivityLogs
};