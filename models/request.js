const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Request = sequelize.define('request', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  ticketId: {
    type: Sequelize.STRING,
    allowNull: true,
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
  assignedName: {
    type: Sequelize.STRING,
    allowNull: true
  },
  department: {
    type: Sequelize.STRING,
    allowNull: false
  },
  staffDepartment: {
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
    type: Sequelize.TEXT,
    allowNull: false
  },
  attachment: {
    type: Sequelize.ARRAY(Sequelize.STRING),
    defaultValue: [],
    allowNull: true
  },
  isRepeated: {
    type: Sequelize.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  approval1Comment: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  approval2Comment: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  forwardComment: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  problemDescription: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  actionTaken: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  approval1: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  approval1Time: {
    type: Sequelize.DATE,
    allowNull: true
  },
  approval2: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  approval2Time: {
    type: Sequelize.DATE,
    allowNull: true
  },
});

module.exports = Request;