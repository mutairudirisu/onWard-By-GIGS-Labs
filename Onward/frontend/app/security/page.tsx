import type { Metadata } from "next";
import { LegalLayout, type LegalSection } from "@/components/legal";

export const metadata: Metadata = {
  title: "Security — GIGS Labs",
  description:
    "How GIGS Labs protects onWard and your data: encryption, offline-first storage, access controls, responsible disclosure and incident response.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "philosophy",
    heading: "Our security philosophy",
    body: (
      <p>
        Security and privacy are the same idea from two angles: your data should
        be yours, and it should be safe while we hold it for you. We design
        onWard to collect as little as possible, keep your content on your device
        by default, and protect everything that does sync. Because we are a small
        team, security is everyone&rsquo;s job here — not a silo.
      </p>
    ),
  },
  {
    id: "encryption",
    heading: "Data in transit and at rest",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          All communication between the app, website and our servers uses modern
          TLS so nothing travels in the clear.
        </li>
        <li>
          Synced data is encrypted at rest on managed infrastructure in vetted
          regions.
        </li>
        <li>
          Secrets and credentials are stored in dedicated secret managers, never
          hard-coded or committed.
        </li>
      </ul>
    ),
  },
  {
    id: "offline-first",
    heading: "Offline-first, on-device by default",
    body: (
      <p>
        onWard writes to your device first. If you use it without signing in, your
        content never leaves the device at all. Sync only happens when you are
        signed in and connected, and it is scoped to your own account — one
        person&rsquo;s data is never mixed with or visible to another&rsquo;s.
      </p>
    ),
  },
  {
    id: "access",
    heading: "Access controls and authentication",
    body: (
      <>
        <p>
          We follow least-privilege: staff and systems get only the access a task
          requires, and that access is reviewed. Sign-in is protected through
          secure, standard authentication, and we encourage strong, unique
          credentials for your account.
        </p>
        <p>
        Production data access is logged. We do not hand your raw content to
        anyone inside the company without a clear, documented reason.
        </p>
      </>
    ),
  },
  {
    id: "sharing-controls",
    heading: "Sharing you control",
    body: (
      <p>
        Anything you publish — a portfolio or a streak — is explicit and
        revocable. Share links are private unless you send them, you can revoke
        any link in a tap, and revocation takes effect immediately. Nothing is
        made public without you choosing it.
      </p>
    ),
  },
  {
    id: "portability",
    heading: "Data portability and deletion",
    body: (
      <p>
        You can export your full history whenever you like and delete your
        account and content permanently. Deletions are honoured across our systems
        within 30 days, subject only to narrow legal-retention exceptions.
      </p>
    ),
  },
  {
    id: "operations",
    heading: "How we operate",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>Dependencies are kept updated and scanned for known vulnerabilities.</li>
        <li>Infrastructure is monitored, with alerts for suspicious activity.</li>
        <li>Backups are encrypted, tested for restore, and access-controlled.</li>
        <li>Security is part of how we build, not a step bolted on at release.</li>
      </ul>
    ),
  },
  {
    id: "your-part",
    heading: "Your part",
    body: (
      <p>
        A lot of security is shared. Please keep your password unique, enable any
        available device lock or verification, do not share your account, and
        treat your own share links like anything else you have published. Tell us
        immediately if you suspect your account is compromised.
      </p>
    ),
  },
  {
    id: "disclosure",
    heading: "Report a vulnerability",
    body: (
      <>
        <p>
          Found a weakness? We want to know. Email{" "}
          <a
            href="mailto:security@gigslabs.example"
            className="font-semibold text-lime-deep hover:underline"
          >
            security@gigslabs.example
          </a>{" "}
          and we will acknowledge promptly and work with you.
        </p>
        <p>
          <strong>Safe harbour:</strong> good-faith research on your own account,
          without disrupting others or exfiltrating data, will not lead to legal
          action against you. Please give us reasonable time to fix before
          disclosing publicly.
        </p>
      </>
    ),
  },
  {
    id: "incidents",
    heading: "Incident response",
    body: (
      <p>
        If a material breach affecting your data occurs, we will investigate,
        contain it, and notify affected users and any relevant authorities within
        the timelines the law requires — no slower than we would want to be told
        ourselves.
      </p>
    ),
  },
  {
    id: "security-contact",
    heading: "Questions",
    body: (
      <p>
        For anything security-related, contact{" "}
        <a
          href="mailto:security@gigslabs.example"
          className="font-semibold text-lime-deep hover:underline"
        >
          security@gigslabs.example
        </a>
        . For how we handle data day-to-day, read our{" "}
        <a href="/privacy" className="font-semibold text-lime-deep hover:underline">
          Privacy Policy
        </a>
        .
      </p>
    ),
  },
];

export default function Security() {
  return (
    <LegalLayout
      eyebrow="Security"
      title="How we keep onWard safe."
      updated="29 October 2026"
      subtitle="The measures we take to protect your data and your account — and how to tell us about a risk."
      preamble={
        <p>
          We treat your growth history as something worth protecting. This page
          summarises our engineering practices in plain terms. It is not a
          certification or a guarantee, but a real account of how we think about
          security at a small, early company.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
