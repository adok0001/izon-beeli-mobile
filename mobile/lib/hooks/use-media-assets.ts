import { apiFetch, apiFetchMultipart } from "@/lib/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface MediaAsset {
  id: string;
  url: string;
  kind: "image" | "audio";
  filename: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

type FormDataFile = { uri: string; type: string; name: string };
function appendFile(form: FormData, field: string, file: FormDataFile) {
  form.append(field, file as unknown as Blob);
}

export function useMediaAssets(kind: "all" | "image" | "audio", search?: string) {
  const { getToken, isSignedIn } = useAuth();
  return useQuery<{ assets: MediaAsset[] }>({
    queryKey: ["media-assets", kind, search ?? ""],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams();
      if (kind !== "all") params.set("kind", kind);
      if (search) params.set("search", search);
      return apiFetch<{ assets: MediaAsset[] }>(`/upload/media?${params}`, { token: token ?? undefined });
    },
    enabled: !!isSignedIn,
  });
}

export function useUploadMediaAsset() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ uri, kind, filename, mimeType }: { uri: string; kind: "image" | "audio"; filename: string; mimeType: string }) => {
      const token = await getToken();
      const formData = new FormData();
      appendFile(formData, "file", { uri, type: mimeType, name: filename });
      return apiFetchMultipart<{ url: string; id: string }>(`/upload/${kind}`, formData, { token });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media-assets"] }),
  });
}

export function useDeleteMediaAsset() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      return apiFetch<{ ok: true }>(`/upload/media/${id}`, { method: "DELETE", token: token ?? undefined });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["media-assets"] }),
  });
}
