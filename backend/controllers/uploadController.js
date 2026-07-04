const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadController = {
  uploadFile: async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded. Please attach a valid file.' });
    }

    const localFilePath = req.file.path;

    try {
      // Check if Cloudinary is configured
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      if (!cloudName) {
        // Safe fallback for offline development mode if Cloudinary is not configured yet
        console.warn('Cloudinary not configured. Returning local relative path.');
        const relativePath = `/uploads/${req.file.filename}`;
        return res.status(200).json({
          success: true,
          message: 'Uploaded locally (Cloudinary offline fallback).',
          url: relativePath,
          fileName: req.file.originalname,
        });
      }

      console.log(`Uploading file ${req.file.originalname} to Cloudinary using resource_type: auto...`);
      
      const uploadOptions = {
        folder: 'hrms_resumes',
        resource_type: 'auto',
      };

      const result = await cloudinary.uploader.upload(localFilePath, uploadOptions);

      // Clean up local temp file asynchronously
      fs.unlink(localFilePath, (err) => {
        if (err) console.error('Failed to delete temporary local file:', err);
      });

      return res.status(200).json({
        success: true,
        message: 'File uploaded successfully to Cloudinary.',
        url: result.secure_url,
        fileName: req.file.originalname,
      });
    } catch (err) {
      console.error('================ CLOUDINARY UPLOAD ERROR ================');
      console.error('Error message:', err.message);
      console.error('Error code/status:', err.code || err.http_code);
      console.error('Error stack:', err.stack);
      console.error('Full Error Object:', err);
      console.error('==========================================================');
      
      // Attempt clean up of local file on error
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
      
      return res.status(500).json({ message: 'Failed to upload resume to cloud storage.' });
    }
  },
};

module.exports = uploadController;
