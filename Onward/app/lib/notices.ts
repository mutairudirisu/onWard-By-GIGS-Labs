"use client";

export type NoticeKind =
  | "reminder"
  | "streak"
  | "task"
  | "win"
  | "note"
  | "welcome";

export type NoticeInput = {
  id?: string;
  kind: NoticeKind;
  title: string;
  body: string;
  href?: string;
  at?: string;
};

export type AppNotice = NoticeInput & { id: string; at: string };

export const NOTICE_EVENT = "onward:notice";

/** Let any screen drop a notice into the feed without prop drilling. */
export function emitNotice(input: NoticeInput) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NoticeInput>(NOTICE_EVENT, { detail: input }));
}
