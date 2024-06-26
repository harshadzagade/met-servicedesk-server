const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Staff = sequelize.define('staff', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  firstname: {
    type: Sequelize.STRING,
    allowNull: false
  },
  middlename: {
    type: Sequelize.STRING,
    allowNull: false
  },
  lastname: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.STRING,
    allowNull: false
  },
  institute: {
    type: Sequelize.STRING,
    allowNull: false
  },
  department: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    allowNull: false
  },
  departmentType: {
    type: Sequelize.STRING,
    allowNull: false
  },
  phoneNumber: {
    type: Sequelize.BIGINT,
    allowNull: true
  },
  contactExtension: {
    type: Sequelize.STRING,
    allowNull: true
  },
  isNew: {
    type: Sequelize.BOOLEAN,
    allowNull: false
  }
});

module.exports = Staff;