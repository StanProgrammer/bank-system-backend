const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Customer = require('../models/Customer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer and Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'profile_pics', 
    allowed_formats: ['jpg', 'jpeg', 'png'],
    transformation: [{ width: 150, height: 150, crop: 'fill' }]
  }
});
const parser = multer({ storage: storage });

// Upload image endpoint
const uploadImage = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.user.id);

    if (!customer) {
      return res.status(404).json({ msg: 'Customer not found' });
    }

    // Upload image to Cloudinary
    parser.single('image')(req, res, async (err) => {
      if (err) {
        console.error('Error uploading image:', err);
        return res.status(500).json({ msg: 'Failed to upload image' });
      }

      // Update profilePic URL in customer document
      customer.profilePic = req.file.path; // Assuming multer-cloudinary returns 'path' in req.file

      await customer.save();

      res.json({ profilePic: customer.profilePic });
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ msg: 'Server error' });
  }
};

module.exports = uploadImage;
