const express = require('express');
const {
  createUrl,
  listUrls,
  getUrl,
  updateUrl,
  deleteUrl,
  bulkAction,
  getAnalytics,
  verifyPassword,
  checkAlias,
  createValidators,
} = require('../controllers/urlController');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/check-alias', checkAlias);
router.post('/', optionalAuth, createValidators, createUrl);
router.get('/', protect, listUrls);
router.post('/bulk', protect, bulkAction);
router.get('/:id/analytics', protect, getAnalytics);
router.post('/:code/verify', verifyPassword);
router.get('/:id', protect, getUrl);
router.patch('/:id', protect, updateUrl);
router.delete('/:id', protect, deleteUrl);

module.exports = router;
