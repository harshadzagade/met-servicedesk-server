const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const cors = require('cors');
const bcrypt = require('bcryptjs');

const sequelize = require('./utils/database');
const Staff = require('./models/staff');

const loginRoute = require('./routes/login');
const instituteRoutes = require('./routes/institute');
const departmentRoutes = require('./routes/department');
const staffRoutes = require('./routes/staff');
const trashRoutes = require('./routes/trash');
const requestRoutes = require('./routes/request');
const complaintRoutes = require('./routes/complaint');
const reportRoutes = require('./routes/report');

app.use(cors());

app.use(bodyParser.json());

app.use('/api/request', requestRoutes);
app.use('/api/complaint', complaintRoutes);
app.use('/api', loginRoute);
app.use('/api/institute', instituteRoutes);
app.use('/api/department', departmentRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/trash', trashRoutes);
app.use('/api/report', reportRoutes);

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
                firstname: 'Super',
                middlename: '',
                lastname: 'Admin',
                email: 'superadmin@gmail.com',
                password: password,
                role: 'superadmin',
                institute: 'ERP',
                department: ['all'],
                departmentType: 'service',
                isNew: false
            }
        });
    });
    return staff;
}).catch((error) => {
    console.log(error);
});