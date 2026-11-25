import type { Metadata } from "next";
import { LegalLayout, type LegalSection } from "@/components/legal";
import { emailFor, mailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Security — GIGS Labs",
  description:
    "How GIGS Labs protects onWard and your data: per-user database isolation, TLS, access controls, responsible disclosure and incident response.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "philosophy",
    heading: "Our security philosophy",
    body: (
      <p>
        Security and privacy are the same idea from two angles: your data should
        be yours, and it should be safe while we hold it for you. onWard collects
        only what a feature needs, keeps every row tied to the account that
        created it, and publishes nothing on its own. Because we are a small team,
        security is everyone&rsquo;s job here — not a silo.
      </p>
    ),
  },
  {
    id: "encryption",
    heading: "Data in transit and at rest",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          All communication between the app, the website and our servers goes over
          TLS, so nothing travels in the clear.
        </li>
        <li>
          Your content sits in a managed Postgres database. The provider encrypts
          the underlying storage and we do not hold a second copy of your content in
          a warehouse, a data lake or an analytics tool.
        </li>
        <li>
          Keys and connection strings live in the deployment&rsquo;s environment
          variables and the database dashboard — never in the repo, never in the
          browser bundle. The service-role key, which can read past those
          isolation rules, stays on the server side and is not given to any client.
        </li>
      </ul>
    ),
  },
  {
    id: "isolation",
    heading: "One account cannot read another",
    body: (
      <p>
        Every table enforces row-level security: a query only returns rows whose
        owner matches the signed-in user, and the database itself rejects the rest
        — the check is not something the app can talk its way around. We verify
        this by reading one account&rsquo;s rows while authenticated as another and
        getting nothing back. That isolation, not a promise, is what makes
        multi-tenant storage acceptable to us at this size.
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
          requires, and that access is reviewed. Sign-in goes through the database
          provider&rsquo;s authentication — email and password with reset by email,
          or Google — and the app never sees your password.
        </p>
        <p>
          Because we are early, we will not overstate this: there is no 24/7
          SOC, no formal access-review tool and no independent audit yet. What
          there is: two founders, separate accounts, and a production database we
          touch deliberately rather than casually.
        </p>
      </>
    ),
  },
  {
    id: "sharing-controls",
    heading: "Sharing you control",
    body: (
      <p>
        Nothing becomes public by accident: every onWard stays inside your
        account, and the feed only ever shows what you chose to write as a post.
        A post carries its text, any photos or clips you attached, your first
        name and your initials — and deleting it takes the files, the comments
        and the likes with it. A post&rsquo;s own link can be read by anyone,
        which is why posting stays a deliberate act. There is no public profile
        page and no shareable portfolio link. The share buttons inside the app
        either copy text to your clipboard or hand a card to your
        device&rsquo;s own share sheet, and what you show an employer today is a
        portfolio or CV file you download and send yourself.
      </p>
    ),
  },
  {
    id: "portability",
    heading: "Data portability and deletion",
    body: (
      <p>
        Your portfolio downloads as a PDF from inside the app. A full machine-
        readable export and a self-service delete-account button are not shipped
        yet, so both of those are a request: email us and we will pull your data
        or remove your account and its rows, then confirm it back to you.
      </p>
    ),
  },
  {
    id: "operations",
    heading: "How we operate",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>
          Dependencies move with the framework releases we track, and we review
          what we add rather than installing blindly.
        </li>
        <li>
          Deployment and database logs are ours to read, and we read them whenever
          something looks wrong or a user reports one.
        </li>
        <li>
          The managed database takes backups. Retention on our current plan is
          short, which is exactly why we push for exports rather than relying on a
          restore.
        </li>
        <li>
          Migrations are versioned in the repo and applied deliberately, so a
          schema change has a name, a date and a reason.
        </li>
      </ul>
    ),
  },
  {
    id: "your-part",
    heading: "Your part",
    body: (
      <p>
        A lot of security is shared. Please keep your password unique, use the
        lock or biometrics on the device you log in from, do not share your
        account, and remember that onWard runs in a browser — an unlocked shared
        laptop is an open journal. Tell us immediately if you suspect your account
        is compromised.
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
            href={mailto("security")}
            className="font-semibold text-lime-deep hover:underline"
          >
            {emailFor("security")}
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
          href={mailto("security")}
          className="font-semibold text-lime-deep hover:underline"
        >
          {emailFor("security")}
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
      updated="3 November 2026"
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
