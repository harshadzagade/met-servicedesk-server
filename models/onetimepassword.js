const Sequelize = require('sequelize');
const sequelize = require('../utils/database');

const OneTimePassword = sequelize.define('onetimepassword', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    otp: Sequelize.DataTypes.STRING,
    expiration_time: Sequelize.DataTypes.DATE,
    verified: {
        type: Sequelize.DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: true
    }
});

module.exports = OneTimePassword;