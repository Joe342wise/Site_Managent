-- Update profile_image column to handle larger base64 data
ALTER TABLE users MODIFY COLUMN profile_image LONGTEXT;