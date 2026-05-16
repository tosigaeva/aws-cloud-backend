export type UploadUrlProvider = {
  getSignedUploadUrl: (fileName: string) => Promise<string>;
};

export const createUploadedKey = (fileName: string) => `uploaded/${fileName}`;

export const validateFileName = (fileName?: string) => {
  const normalizedName = fileName?.trim();

  if (!normalizedName) {
    throw new Error('File name is required');
  }

  if (normalizedName.includes('/')) {
    throw new Error('File name must not include path separators');
  }

  return normalizedName;
};
