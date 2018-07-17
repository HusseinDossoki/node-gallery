const router        = require('express').Router();
const path = require('path');
const multer        = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const crypto        = require('crypto');
const mongoose      = require('mongoose');
const Grid          = require('gridfs-stream');

const database = require('../config/database');


// gridfs
let gfs; // define it here so it'll be public
mongoose.connection.once('open', () => {
  // init our stream
  gfs = Grid(mongoose.connection.db, mongoose.mongo);
  gfs.collection('uploads');
});

// create storage engine
const storage = new GridFsStorage({
  url: database.url,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      // generate unique filename
      crypto.randomBytes(16, (err, buf) => {
        if(err) return reject(err);
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});

const upload = multer({ storage });


// get all images from database and render index.ejs
router.get('/', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if(err) throw err;
    if(!files || files.length === 0) {
      res.render('index', {files: false});
    } else {
      files.map(file => {
        if(file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
          file.isImage = true;
        } else {
          file.isImage = false;
        }
      });
      res.render('index', {files: files});
    }
  });
  
});


// upload file
router.post('/upload', upload.single('fileInput'), (req, res) => {
  // res.json({file: req.file});
  res.redirect('/');
});


// get the image stream from database
router.get('/image/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) => {
    if (err) throw err;
    if (!file) res.status(404).json({err: 'not exist'});

    // if there is a file, check if its an image
    if(file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      // read stream from database to the browser
      const readStream = gfs.createReadStream(file.filename);
      readStream.pipe(res);
    } else {
      res.status(404).json({err: 'not an image'});
    }

  });
});


// delete file from database
router.delete('/files/:id', (req, res) => {
  gfs.remove({_id: req.params.id, root: 'uploads'}, (err, gridStore) => {
    if(err) {
      res.status(404).json({err: err})
    };
    res.redirect('/');
  });
});


// ****************  some REST APIs routes ************************

// get all uploaded files from database
router.get('/api/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if(err) throw err;
    if(!files || files.length === 0) {
      return res.status(404).json({
        err: 'NO files found'
      });
    }
    return res.json(files);
  });
});


// get a single file from database by it's name
router.get('/api/files/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) => {
    if(err) throw err;
    if(!file) {
      return res.status(404).json({err: 'No file exists'})
    }
    return res.json(file);
  });
});

module.exports = router;