const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/comprovantes"));
  },

  filename: (req, file, cb) => {
    const nomeUnico = Date.now() + "-" + file.originalname;
    cb(null, nomeUnico);
  },
});

const upload = multer({ storage });

module.exports = upload;