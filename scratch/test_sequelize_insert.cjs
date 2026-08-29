const axios = require('axios');
const { Expense, sequelize } = require('../server/models');

// Enable logging
sequelize.options.logging = console.log;

(async () => {
  try {
    console.log('Creating expense directly via Sequelize...');
    const dbExpense = await Expense.create({
      description: 'Direct Sequelize Expense',
      amount: 15000,
      category: 'Marketing',
      courseId: 1,
      batchId: 1,
      date: '2026-07-30'
    });
    console.log('Direct Sequelize Expense created:', dbExpense.get({ plain: true }));
  } catch (e) {
    console.error('Error during Sequelize test:', e);
  }
  process.exit();
})();
