import { auth } from "./firebase";

import type {
  StorageService,
  UploadResult,
} from "./storage";

async function getAdminToken(): Promise<string> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error(
      "You must be signed in as an administrator.",
    );
  }

  return user.getIdToken();
}

async function readError(
  response: Response,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: string;
    };

    return data.error || "Storage request failed.";
  } catch {
    return "Storage request failed.";
  }
}

const storageProvider: StorageService = {
  async uploadFile(
    file: File,
    folder: string,
    _fileName?: string,
  ): Promise<UploadResult> {
    const token = await getAdminToken();

    const formData = new FormData();

    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch(
      "/api/storage/upload",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      throw new Error(
        await readError(response),
      );
    }

    const result =
      (await response.json()) as UploadResult;

    return result;
  },

  async deleteFile(
    path: string,
  ): Promise<void> {
    const token = await getAdminToken();

    const response = await fetch(
      `/api/storage/file/${encodeURIComponent(path)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        await readError(response),
      );
    }
  },

  async getFileUrl(
    path: string,
  ): Promise<string> {
    return `/api/storage/file/${encodeURIComponent(path)}`;
  },
};

export default storageProvider;