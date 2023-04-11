const Sequelize = require('sequelize');
const sequelize = new Sequelize('service_desk_demo', 'root', '', {
    dialect: 'mysql',
    host: 'localhost',
    define: {
        timestamps: true,
        freezeTableName: true
    }
});

module.exports = sequelize;