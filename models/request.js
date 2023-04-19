const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Request = sequelize.define('request', {
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
  behalf: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  behalfId: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  status: {
    type: Sequelize.STRING,
    defaultValue: 'pending',
    allowNull: false
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
  },
  attachment: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    defaultValue: [],
    allowNull: true
  },
  approval1: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  approval2: {
    type: Sequelize.INTEGER,
    allowNull: true
  }
});

module.exports = Request;