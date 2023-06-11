const util = require("util");
const multer = require('multer');
const fs = require('fs');

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        fs.mkdir('./files/',(error)=>{
            cb(null,'files');
        })
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getTime() + '-' + file.originalname);
    }
});

const uploadFiles = multer({ storage: fileStorage, limits: { fileSize: 5 * 1024 * 1024 } }).array('file', 50);
const uploadFilesMiddleware = util.promisify(uploadFiles);
module.exports = uploadFilesMiddleware;