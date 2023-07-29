const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const SubadminActivities = sequelize.define('subadminactivities', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  adminId: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  department: {
    type: Sequelize.STRING,
    allowNull: false
  },
  activities: {
    type: Sequelize.ARRAY(Sequelize.JSONB),
    allowNull: true
  }
});

module.exports = SubadminActivities;