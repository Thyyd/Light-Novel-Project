import cloudinary from '../config/cloudinary.js';

export function uploadImageToCloudinary(fileBuffer, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) {
          reject(error);
        }
        else {
          resolve({ url: result.secure_url, publicId: result.public_id });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
}