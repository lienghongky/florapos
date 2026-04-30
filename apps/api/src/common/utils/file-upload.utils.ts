import { extname, parse } from 'path';
import { diskStorage } from 'multer';

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
 * Filters out non-image files.
 */
export const imageFileFilter = (req: any, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)) {
    return callback(new Error('Only image files are allowed!'), false);
  }
  callback(null, true);
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
