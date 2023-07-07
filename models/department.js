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
    allowNull: false,
    defaultValue: 'N/A'

  },
  category: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false,
    defaultValue: ['N/A']
  }
});

module.exports = Department;