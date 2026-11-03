export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://myonward.vercel.app";

export const LOGIN_URL = `${APP_URL}/sign-in`;
export const SIGNUP_URL = `${APP_URL}/create-account`;

/* One place for every mailbox on the site. Set NEXT_PUBLIC_MAIL_DOMAIN in Vercel
 * once the address exists and all twenty-odd links change together. Until then
 * they land on the reserved .example TLD, which bounces instead of quietly
 * reaching somebody who does not work here. */
const MAIL_DOMAIN = process.env.NEXT_PUBLIC_MAIL_DOMAIN ?? "gigslabs.example";

export const emailFor = (mailbox: string) => `${mailbox}@${MAIL_DOMAIN}`;

export const mailto = (mailbox: string, subject?: string) =>
  `mailto:${emailFor(mailbox)}${
    subject ? `?subject=${encodeURIComponent(subject)}` : ""
  }`;
