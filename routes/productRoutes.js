const express = require('express');
const multer = require('multer');
const router = express.Router();
const productController = require('../controllers/productController');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage });

router.post('/addProduct', upload.single('image'), productController.addProduct);
router.post('/addProducts', productController.addProducts);
router.get('/getAllProducts', productController.getAllProducts);
router.get('/categories-with-counts', productController.getCategoriesWithProductCounts);

module.exports = router;
