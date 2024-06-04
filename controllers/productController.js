const Product = require("../models/Product");
const Brand = require("../models/Brand");
const Category = require("../models/Category");
const ProductCategory = require("../models/ProductCategory");
const { Op } = require("sequelize");

exports.addProduct = async (req, res) => {
  try {
    const { name, brand, categories, price } = req.body;
    const image = req.file ? req.file.path : null;

    if (!brand) {
      return res.status(400).json({ message: "Brand is required" });
    }

    let brandRecord = await Brand.findOne({ where: { name: brand } });
    if (!brandRecord) {
      brandRecord = await Brand.create({ name: brand });
    }

    let categoryRecords = [];
    if (Array.isArray(categories)) {
      categoryRecords = await Promise.all(
        categories.map(async (category) => {
          let categoryRecord = await Category.findOne({
            where: { name: category },
          });
          if (!categoryRecord) {
            categoryRecord = await Category.create({ name: category });
          }
          return categoryRecord;
        })
      );
    } else if (categories) {
      let categoryRecord = await Category.findOne({
        where: { name: categories },
      });
      if (!categoryRecord) {
        categoryRecord = await Category.create({ name: categories });
      }
      categoryRecords = [categoryRecord];
    }

    const newProduct = await Product.create({
      name,
      price,
      image,
      brandId: brandRecord.id,
    });

    await newProduct.setCategories(
      categoryRecords.map((category) => category.id)
    );

    res.status(201).json({
      message: "Product added successfully",
      product: {
        id: newProduct.id,
        name: newProduct.name,
        price: newProduct.price,
        image: newProduct.image,
        brand: {
          id: brandRecord.id,
          name: brandRecord.name,
        },
        categories: categoryRecords.map((category) => ({
          id: category.id,
          name: category.name,
        })),
        createdAt: newProduct.createdAt,
        updatedAt: newProduct.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Something went wrong" });
  }
};

exports.addProducts = async (req, res) => {
  try {
    const products = req.body;

    const newProducts = await Promise.all(
      products.map(async (product) => {
        const { name, brand, categories, price, image } = product;

        if (!brand) {
          throw new Error("Brand is required");
        }

        let brandRecord = await Brand.findOne({ where: { name: brand } });
        if (!brandRecord) {
          brandRecord = await Brand.create({ name: brand });
        }

        let categoryRecords = [];
        if (Array.isArray(categories)) {
          categoryRecords = await Promise.all(
            categories.map(async (category) => {
              let categoryRecord = await Category.findOne({
                where: { name: category },
              });
              if (!categoryRecord) {
                categoryRecord = await Category.create({ name: category });
              }
              return categoryRecord;
            })
          );
        } else if (categories) {
          let categoryRecord = await Category.findOne({
            where: { name: categories },
          });
          if (!categoryRecord) {
            categoryRecord = await Category.create({ name: categories });
          }
          categoryRecords = [categoryRecord];
        }

        const newProduct = await Product.create({
          name,
          price,
          image,
          brandId: brandRecord.id,
        });

        await newProduct.setCategories(
          categoryRecords.map((category) => category.id)
        );

        return {
          id: newProduct.id,
          name: newProduct.name,
          price: newProduct.price,
          image: newProduct.image,
          brand: {
            id: brandRecord.id,
            name: brandRecord.name,
          },
          categories: categoryRecords.map((category) => ({
            id: category.id,
            name: category.name,
          })),
          createdAt: newProduct.createdAt,
          updatedAt: newProduct.updatedAt,
        };
      })
    );

    res
      .status(201)
      .json({ message: "Products added successfully", products: newProducts });
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Something went wrong" });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const { brand, category, sort } = req.query;

    let where = {};
    let include = [
      {
        model: Brand,
        attributes: ["id", "name"],
      },
      {
        model: Category,
        as: "Categories",
        through: { attributes: [] },
        attributes: ["id", "name"],
      },
    ];

    if (brand) {
      const brandRecord = await Brand.findOne({ where: { name: brand } });
      if (brandRecord) where.brandId = brandRecord.id;
    }

    if (category) {
      const categoryRecord = await Category.findOne({
        where: { name: category },
      });
      if (categoryRecord) {
        include.push({
          model: Category,
          as: "Categories",
          where: {
            name: {
              [Op.or]: [category],
            },
          },
          attributes: ["id", "name"],
          through: { attributes: [] },
          required: true,
        });
      } else {
        return res.status(200).json([]);
      }
    }

    let order = [];
    if (sort) {
      const [sortField, sortOrder] = sort.split(":");
      order.push([sortField, sortOrder.toUpperCase()]);
    }

    const products = await Product.findAll({
      where,
      include,
      order,
    });

    const modifiedProducts = products.map((product) => ({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      brand: {
        id: product.Brand.id,
        name: product.Brand.name,
      },
      categories: product.Categories.map((category) => ({
        id: category.id,
        name: category.name,
      })),
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    }));

    res.status(200).json(modifiedProducts);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Something went wrong" });
  }
};

exports.getCategoriesWithProductCounts = async (req, res) => {
  try {
    const categories = await Category.findAll({
      include: [
        {
          model: Product,
          as: "Products",
          through: { attributes: [] },
          attributes: ["id"],
        },
      ],
    });

    const categoriesWithCounts = categories.map((category) => ({
      id: category.id,
      name: category.name,
      productCount: category.Products.length,
      productIds: category.Products.map((product) => product.id),
    }));

    res.status(200).json(categoriesWithCounts);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: "Something went wrong" });
  }
};
