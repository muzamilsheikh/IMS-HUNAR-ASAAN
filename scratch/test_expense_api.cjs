const axios = require('axios');
const { Expense } = require('../server/models');

(async () => {
  try {
    console.log('Logging in...');
    const loginRes = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@hunarasaan.com',
      password: 'Hun@r@s@@n@786@867'
    });
    
    const token = loginRes.data.token;
    console.log('Token obtained:', token);
    
    console.log('Creating expense via API...');
    const createRes = await axios.post('http://localhost:5001/api/expenses', {
      description: 'Test API Expense',
      amount: 15000,
      category: 'Marketing',
      courseId: 1,
      batchId: 1,
      date: '2026-07-30'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('API Response:', createRes.data);
    
    console.log('Checking database record...');
    const dbExpense = await Expense.findByPk(createRes.data.id);
    console.log('DB Expense fields:', dbExpense.get({ plain: true }));
    
  } catch (e) {
    console.error('Error during test:', e.response?.data || e.message);
  }
  process.exit();
})();
