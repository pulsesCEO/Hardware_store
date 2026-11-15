const express = require('express');
const router = express.Router();
const statementController = require('../controllers/statementController');

router.get('/customer/:customerId', statementController.getCustomerStatement);
router.get('/supplier/:supplierId', statementController.getSupplierStatement);

module.exports = router;