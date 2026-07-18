import { apiFetchMultipart } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation } from "@tanstack/react-query";

/** Uploads an educator-picked SVG file to `/upload/svg`, returning its public URL. */
export function useUploadSceneIllustration() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async ({ uri, filename }: { uri: string; filename: string }) => {
      const token = await getToken();
      const formData = new FormData();
      formData.append("file", { uri, type: "image/svg+xml", name: filename } as unknown as Blob);
      return apiFetchMultipart<{ url: string; id: string }>("/upload/svg", formData, { token });
    },
  });
}
