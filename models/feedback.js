const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Feedback = sequelize.define('feedback', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    ticketType: {
        type: Sequelize.STRING,
        allowNull: false
    },
    ticketId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    department: {
        type: Sequelize.STRING,
        allowNull: false
    },
    feedback: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Feedback;