export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
}

export interface StorageService {
  uploadFile(
    file: File,
    folder: string,
    fileName?: string,
  ): Promise<UploadResult>;

  deleteFile(path: string): Promise<void>;

  getFileUrl(path: string): Promise<string>;
}