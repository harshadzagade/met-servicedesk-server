const Sequelize = require('sequelize');
const sequelize = new Sequelize('helpdesk', 'postgres', 'root', {
    dialect: 'postgres',
    host: '192.168.4.39',
    define: {
        timestamps: true,
        freezeTableName: true
    }
});

module.exports = sequelize;