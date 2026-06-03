import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = `${import.meta.env.BASE_URL}api`.replace(/\/\/$/, "/");

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json();
}

export function useApplicantProfile() {
  return useQuery({
    queryKey: ["applicant-profile"],
    queryFn: () => apiFetch("/applicant/profile"),
    retry: false,
  });
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch("/applicant/profile", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applicant-profile"] }),
  });
}

export function useApplicantApplications() {
  return useQuery({
    queryKey: ["applicant-applications"],
    queryFn: () => apiFetch("/applicant/applications"),
    retry: false,
  });
}

export function useApplicantApplication(id: number) {
  return useQuery({
    queryKey: ["applicant-application", id],
    queryFn: () => apiFetch(`/applicant/applications/${id}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (data?.status === "reviewing" || data?.status === "pending") return 5000;
      return false;
    },
  });
}

export function useSubmitApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch("/applicant/applications", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["applicant-applications"] }),
  });
}
