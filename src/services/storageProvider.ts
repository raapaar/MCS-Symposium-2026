import type {
  StorageService,
  UploadResult,
} from "./storage";

const storageProvider: StorageService = {
  async uploadFile(
    _file: File,
    _folder: string,
    _fileName?: string,
  ): Promise<UploadResult> {
    throw new Error("Storage provider is not configured yet.");
  },

  async deleteFile(_path: string): Promise<void> {
    throw new Error("Storage provider is not configured yet.");
  },

  async getFileUrl(_path: string): Promise<string> {
    throw new Error("Storage provider is not configured yet.");
  },
};

export default storageProvider;