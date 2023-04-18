const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcryptjs');

const sequelize = require('./utils/database');

const loginRoute = require('./routes/login');
const staffRoutes = require('./routes/staff');
const Staff = require('./models/staff');

const trashRoutes = require('./routes/trash');

const requestRoutes = require('./routes/request');
const complaintRoutes = require('./routes/complaint');

app.use(cors());

app.use(bodyParser.json());

app.use('/request', requestRoutes);
app.use('/complaint', complaintRoutes);
app.use(loginRoute);
app.use('/staff', staffRoutes);
app.use('/trash', trashRoutes);

app.use((error, req, res, next) => {
    console.log(error);
    const status = error.statusCode || 500; // setting default value as 500 if undefined
    const message = error.message;
    const data = error.data;
    res.status(status).json({ message: message, data: data });
});

sequelize.sync().then((result) => { // 'force:true' means overriding table with new changes
    app.listen(8001);
}).then(staff => {
    bcrypt.hash('super@met.edu', 12).then((password) => {
        staff = Staff.findOrCreate({
            where: { id: 1 },
            defaults: {
                firstname: 'Admin',
                lastname: '',
                email: 'superadmin@gmail.com',
                password: password,
                role: 'superadmin',
                department: 'all',
                isNew: false
            }
        });
    });
    return staff;
}).catch((err) => {
    console.log(err);
});