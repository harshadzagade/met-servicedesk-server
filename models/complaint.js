const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Complaint = sequelize.define('complaint', {
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
  }
});

module.exports = Complaint;