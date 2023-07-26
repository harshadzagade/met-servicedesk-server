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
    assignedName: {
        type: Sequelize.STRING,
        allowNull: true
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
    staffDepartment: {
        type: Sequelize.STRING,
        allowNull: false
    },
    status: {
        type: Sequelize.STRING,
        allowNull: false
    },
    loggedTime: {
        type: Sequelize.DATE,
        allowNull: false
    },
    approval1Time: {
        type: Sequelize.DATE,
        allowNull: true
    },
    approval1Duration: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    approval2Time: {
        type: Sequelize.DATE,
        allowNull: true
    },
    assignedTime: {
        type: Sequelize.DATE,
        allowNull: true
    },
    assignDuration: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    attendedTime: {
        type: Sequelize.DATE,
        allowNull: true
    },
    attendDuration: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    lastUpdatedTime: {
        type: Sequelize.DATE,
        allowNull: true
    },
    lastUpdateDuration: {
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