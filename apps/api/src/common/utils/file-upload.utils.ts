import { extname, parse } from 'path';
import { diskStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';

/**
 * Generates a consistent filename for uploaded files.
 * Format: {original-name-without-spaces}-{random-hash}.{ext}
 */
export const editFileName = (req: any, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
  const name = parse(file.originalname).name.replace(/\s/g, '');
  const fileExtName = extname(file.originalname).toLowerCase();

  const randomName = Array(4)
    .fill(null)
    .map(() => Math.round(Math.random() * 16).toString(16))
    .join('');
  callback(null, `${name}-${randomName}${fileExtName}`);
};

/**
 * Filters out non-image files. Supports standard web images plus mobile camera HEIC/HEIF.
 */
export const imageFileFilter = (req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
  const isImageMime = file.mimetype && file.mimetype.toLowerCase().startsWith('image/');
  const isImageExt = file.originalname && file.originalname.match(/\.(jpg|jpeg|png|gif|webp|avif|heic|heif)$/i);

  if (!isImageMime && !isImageExt) {
    return callback(new BadRequestException('Only image files (JPEG, PNG, WEBP, GIF, HEIC) are allowed!'), false);
  }
  callback(null, true);
};

/**
 * Default Multer limits (25MB to accommodate high-res mobile photos before server processing).
 */
export const multerLimits = {
  fileSize: 25 * 1024 * 1024, // 25 MB
};

/**
 * Creates a disk storage engine for multer.
 * @param destination Directory where files will be saved
 */
export const getDiskStorage = (destination: string = './uploads') => {
  return diskStorage({
    destination,
    filename: editFileName,
  });
};
