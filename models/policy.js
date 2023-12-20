const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Policy = sequelize.define('policy', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  policyName: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  policyFileReference: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

module.exports = Policy;