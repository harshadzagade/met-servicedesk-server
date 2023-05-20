const Sequelize = require('sequelize');
const Op = require('sequelize').Op;
const sequelize = require('../utils/database');

const Report = sequelize.define('report', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    isRequest: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    isComplaint: {
        type: Sequelize.BOOLEAN,
        allowNull: true
    },
    requestComplaintId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    staffId: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    staffName: {
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
    department: {
        type: Sequelize.STRING,
        allowNull: false
    },
    loggedTime: {
        type: Sequelize.DATE,
        allowNull: false
    },
    attendedTime: {
        type: Sequelize.DATE,
        allowNull: true
    },
    attendDuration: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    solvedTime: {
        type: Sequelize.DATE,
        allowNull: true
    },
    solveDuration: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    problemDescription: {
        type: Sequelize.STRING,
        allowNull: true
    },
    actionTaken: {
        type: Sequelize.STRING,
        allowNull: true
    }
});

module.exports = Report;