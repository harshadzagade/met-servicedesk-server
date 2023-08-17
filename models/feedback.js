const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const Feedback = sequelize.define('feedback', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    ticketId: {
        type: Sequelize.STRING,
        allowNull: false
    },
    ticketType: {
        type: Sequelize.STRING,
        allowNull: false
    },
    feedback: {
        type: Sequelize.STRING,
        allowNull: false
    }
});

module.exports = Feedback;