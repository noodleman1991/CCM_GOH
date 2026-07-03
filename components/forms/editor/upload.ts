export type UploadedImage = {
  assetRef: string;
  url: string;
  width?: number;
  height?: number;
  lqip?: string;
};

export class ImageUploadError extends Error {}

/**
 * Upload an in-body image file via the shared /api/uploads/image endpoint
 * (Sanity asset store — same pipeline as the case-study featured image).
 * `collaborationId` is passed for workspace docs so the route can enforce
 * "collab:upload" (EDITOR+ membership); omitted for the case-study form,
 * which only requires being signed in (matches /api/case-studies/submit).
 */
export async function uploadEditorImage(
  file: File,
  collaborationId?: string
): Promise<UploadedImage> {
  const formData = new FormData();
  formData.append("file", file);
  if (collaborationId) formData.append("collaborationId", collaborationId);

  let response: Response;
  try {
    response = await fetch("/api/uploads/image", { method: "POST", body: formData });
  } catch {
    throw new ImageUploadError("Network error — check your connection and try again.");
  }

  if (!response.ok) {
    let message = "Upload failed. Please try again.";
    try {
      const body = await response.json();
      if (body?.error) message = body.error;
    } catch {
      // response wasn't JSON — keep the generic message
    }
    throw new ImageUploadError(message);
  }

  return response.json();
}
