const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Complaint = sequelize.define('complaint', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  staffId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'pending',
    allowNull: false
  },
  behalf: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  behalfId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  assign: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  department: {
    type: Sequelize.STRING,
    allowNull: false
  },
  category: {
    type: Sequelize.STRING,
    allowNull: false
  },
  priority: {
    type: Sequelize.STRING,
    allowNull: false
  },
  subject: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

module.exports = Complaint;