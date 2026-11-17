import { supabase } from "./supabase";
import { wardDateLabel } from "./dates";
import { buildPortfolio, type PortfolioModel } from "./portfolio";
import type { OnWard } from "./data";

type SharedPortfolioPayload = {
  user: {
    name: string | null;
    initials: string | null;
    avatarUrl?: string | null;
    role: string | null;
    location: string | null;
    bio: string | null;
  };
  onWards: {
    id: string;
    title: string;
    impact: string;
    body: string | null;
    project: string | null;
    day: string | null;
    skills: string[] | null;
    files: number | null;
  }[];
  skills: string[] | null;
  activeDays: number | null;
  streak: {
    current: number | null;
    longest: number | null;
    daysUsing: number | null;
  } | null;
};

function shareRpcError(error: { code?: string; message: string }) {
  if (error.code === "PGRST202" || error.code === "42883") {
    return new Error(
      "Public sharing is not enabled in the database yet. Apply the portfolio-share migration and refresh the API schema.",
    );
  }
  return new Error(error.message);
}

export async function fetchMyPublicPortfolioShare(): Promise<string | null> {
  const { data, error } = await supabase
    .from("portfolio_shares")
    .select("slug")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.slug ?? null;
}

export async function enablePublicPortfolioShare(): Promise<string> {
  const { data, error } = await supabase.rpc("enable_public_portfolio_share");
  if (error) throw shareRpcError(error);
  if (typeof data !== "string" || !data) {
    throw new Error("The share link could not be created.");
  }
  return data;
}

export async function disablePublicPortfolioShare(): Promise<void> {
  const { error } = await supabase.rpc("disable_public_portfolio_share");
  if (error) throw shareRpcError(error);
}

export async function fetchSharedPortfolio(slug: string): Promise<PortfolioModel | null> {
  const { data, error } = await supabase.rpc("get_public_portfolio", { p_slug: slug });
  if (error) throw shareRpcError(error);
  if (!data) return null;

  const payload = data as SharedPortfolioPayload;
  const onWards: OnWard[] = payload.onWards.map((ward) => ({
    id: ward.id,
    title: ward.title,
    impact: ward.impact,
    body: ward.body ?? undefined,
    project: ward.project ?? undefined,
    date: ward.day ?? undefined,
    dateLabel: ward.day ? wardDateLabel(ward.day) : "",
    skills: ward.skills ?? [],
    evidence: [],
    files: ward.files ?? 0,
    inPortfolio: true,
  }));
  const activeDays = payload.activeDays ?? 0;
  const streak = payload.streak;

  return buildPortfolio({
    user: {
      name: payload.user.name ?? "onWard member",
      initials: payload.user.initials ?? "",
      avatarUrl: payload.user.avatarUrl,
      role: payload.user.role ?? "",
      location: payload.user.location ?? "",
      bio: payload.user.bio ?? "",
      email: "",
    },
    onWards,
    skills: payload.skills ?? [],
    days: [],
    activeDays,
    streak: {
      current: streak?.current ?? 0,
      longest: streak?.longest ?? 0,
      daysUsing: streak?.daysUsing ?? activeDays,
    },
  });
}
