const express = require('express');
const mongoose = require('mongoose');
const { Readable } = require('stream');

let gridfsBucket;
mongoose.connection.once('open', () => {
  gridfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
});

module.exports = (upload) => {
  const router = express.Router();

  router.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file || !gridfsBucket) {
      return res.status(400).json({ message: "No file uploaded or GridFS not initialized" });
    }

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const uploadStream = gridfsBucket.openUploadStream(req.file.originalname, {
      contentType: req.file.mimetype,
    });

    bufferStream.pipe(uploadStream);

    uploadStream.on("finish", () => {
      res.json({ message: "File uploaded", fileId: uploadStream.id });
    });

    uploadStream.on("error", (err) => {
      console.error(err);
      res.status(500).json({ message: "Error uploading file" });
    });
  });

  router.get('/', async (req, res) => {
    try {
      const files = await gridfsBucket.find().toArray();
      res.json(files);
    } catch (error) {
      res.status(500).json({ message: "Error fetching files" });
    }
  });

  router.get('/:filename', async (req, res) => {
    try {
      const files = await gridfsBucket.find({ filename: req.params.filename }).toArray();
      if (!files.length) return res.status(404).json({ message: "File not found" });

      const file = files[0];
      res.set({
        "Content-Type": file.contentType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${file.filename}"`,
      });

      const downloadStream = gridfsBucket.openDownloadStream(file._id);
      downloadStream.pipe(res);
    } catch (error) {
      res.status(500).json({ message: "Error fetching file" });
    }
  });

  router.delete('/:filename', async (req, res) => {
    try {
      const files = await gridfsBucket.find({ filename: req.params.filename }).toArray();
      if (!files.length) return res.status(404).json({ message: "File not found" });

      await gridfsBucket.delete(files[0]._id);
      res.json({ message: "File deleted" });
    } catch (error) {
      res.status(500).json({ message: "Error deleting file" });
    }
  });

  return router;
};
