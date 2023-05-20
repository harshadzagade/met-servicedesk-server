const Sequelize = require('sequelize');
const sequelize = new Sequelize('service_desk_demo', 'postgres', 'root', {
    dialect: 'postgres',
    host: 'localhost',
    define: {
        timestamps: true,
        freezeTableName: true
    }
});

module.exports = sequelize;