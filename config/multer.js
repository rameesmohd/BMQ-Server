const multer = require("multer");

function createMulter() {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            // Set the destination directory where you want to store files
            cb(null, './public');
        },
        filename: function (req, file, cb) {
            // Generate a unique filename (you might want to improve this logic)
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `${uniqueSuffix}-${file.originalname}`);
        },
    });

    const upload = multer({ storage: storage });
    return upload;
}

module.exports = {
    createMulter
};