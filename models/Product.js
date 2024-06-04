const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const Brand = require("./Brand");
const Category = require("./Category");

const Product = sequelize.define(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    image: {
      type: DataTypes.STRING,
    },
    brandId: {
      type: DataTypes.INTEGER,
      references: {
        model: Brand,
        key: 'id',
      },
    },
  },
  {
    timestamps: true,
  }
);

Product.belongsTo(Brand, { foreignKey: 'brandId' });
Product.belongsToMany(Category, { through: 'ProductCategories', foreignKey: 'productId' });
Category.belongsToMany(Product, { through: 'ProductCategories', foreignKey: 'categoryId' });

module.exports = Product;
