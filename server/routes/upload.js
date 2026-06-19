const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const router = express.Router();

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('只支持 JPG、PNG、GIF 格式的图片'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.post('/avatar', upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传形象照片'
      });
    }

    const avatarUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: '上传成功',
      data: {
        url: avatarUrl,
        filename: req.file.filename
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '上传失败',
      error: error.message
    });
  }
});

router.post('/idcard', upload.fields([
  { name: 'front', maxCount: 1 },
  { name: 'back', maxCount: 1 }
]), (req, res) => {
  try {
    const result = {};

    if (req.files['front']) {
      result.front = `/uploads/${req.files['front'][0].filename}`;
    }

    if (req.files['back']) {
      result.back = `/uploads/${req.files['back'][0].filename}`;
    }

    if (Object.keys(result).length === 0) {
      return res.status(400).json({
        success: false,
        message: '请上传身份证照片'
      });
    }

    res.json({
      success: true,
      message: '上传成功',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '上传失败',
      error: error.message
    });
  }
});

module.exports = router;
