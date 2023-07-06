const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Department = sequelize.define('department', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  institute: {
    type: Sequelize.STRING,
    allowNull: false
  },
  instituteType: {
    type: Sequelize.STRING,
    allowNull: false
  },
  department: {
    type: Sequelize.STRING,
    allowNull: true
  },
  category: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: true
  }
});

module.exports = Department;