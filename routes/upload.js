const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const QRCode = require('qrcode');
const archiver = require('archiver');

const router = express.Router();

// Configure Multer (Memory Storage)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/upload', upload.array('files', 10), async (req, res) => {
    try {
        const groupId = uuidv4();
        const files = req.files.map(file => ({
            filename: file.originalname,
            content: file.buffer,
            mimetype: file.mimetype,
            size: file.size,
            groupId
        }));

        await File.insertMany(files);

        // Change QR Code URL to the React Download Page
        const frontendBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173'; // Update with frontend URL
        const downloadPageUrl = `${frontendBaseUrl}/download/${groupId}`;
        const qrCode = await QRCode.toDataURL(downloadPageUrl);

        // console.log(`Download Page: ${downloadPageUrl}`);

        res.status(200).json({
            success: true,
            groupId,
            qrCode,
            filesCount: files.length
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: 'Upload failed' });
    }
});

router.get('/files/:groupId', async (req, res) => {
    try {
        const files = await File.find({ groupId: req.params.groupId });
        if (!files.length) {
            return res.status(404).json({ message: 'Files not found or expired' });
        }

        res.json({
            groupId: req.params.groupId,
            files: files.map(file => ({
                filename: file.filename,
                size: file.size,
                type: file.mimetype
            }))
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/download-zip/:groupId', async (req, res) => {
    try {
        const files = await File.find({ groupId: req.params.groupId });
        if (!files.length) {
            return res.status(404).json({ message: 'Files not found or expired' });
        }

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename=files-${req.params.groupId}.zip`);

        const archive = archiver('zip', { zlib: { level: 9 } });

        archive.pipe(res);

        files.forEach(file => {
            archive.append(file.content, { name: file.filename });
        });

        archive.finalize().catch(err => {
            console.error('Archive error:', err);
            res.status(500).json({ message: 'Error creating ZIP' });
        });

    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ message: 'Download failed' });
    }
});

module.exports = router;
