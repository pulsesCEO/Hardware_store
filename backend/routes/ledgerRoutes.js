const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');

router.get('/', ledgerController.getLedgerData);
router.post('/collect-payment', ledgerController.collectPayment);
router.post('/pay-supplier', ledgerController.paySupplier);

module.exports = router;