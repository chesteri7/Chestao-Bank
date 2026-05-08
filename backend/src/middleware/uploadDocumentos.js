const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documentos');
  },

  filename: (req, file, cb) => {
    const nomeArquivo =
      Date.now() + path.extname(file.originalname);

    cb(null, nomeArquivo);
  }
});

const uploadDocumento = multer({ storage });

module.exports = uploadDocumento;