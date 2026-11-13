const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');

router.post('/', purchaseController.createPurchase); 

// 👇 ADD THIS MISSING LINE
router.get('/', purchaseController.getAllPurchases); 

module.exports = router;