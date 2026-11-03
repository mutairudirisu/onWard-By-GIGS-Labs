import type { Metadata } from "next";
import { LegalLayout, type LegalSection } from "@/components/legal";
import { emailFor, mailto } from "@/lib/site";

export const metadata: Metadata = {
  title: "Privacy Policy — GIGS Labs",
  description:
    "How onWard and GIGS Labs collect, use, store and protect your personal data — and the rights you have over it.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "who-we-are",
    heading: "Who we are",
    body: (
      <>
        <p>
          GIGS Labs (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;onWard&rdquo;) is
          a software company based in Lagos, Nigeria, and the publisher of the
          onWard app and website. We are the data controller for the personal
          data described in this policy.
        </p>
        <p>
          Questions, requests or complaints about privacy can reach a human at{" "}
          <a
            href={mailto("privacy")}
            className="font-semibold text-lime-deep hover:underline"
          >
            {emailFor("privacy")}
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    heading: "What we collect",
    body: (
      <>
        <p>We keep collection to the minimum a feature genuinely needs:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Account data</strong> — your name or handle, email address,
            chosen role, and profile details you add.
          </li>
          <li>
            <strong>Content you create</strong> — tasks, notes, onWards, streaks
            and portfolio entries. This is the heart of the product.
          </li>
          <li>
            <strong>Device &amp; session data</strong> — the sign-in session your
            browser keeps, plus device type and app version, so the app knows
            which build to serve you.
          </li>
          <li>
            <strong>Activity you generate</strong> — completing a task, writing a
            note, logging an onWard. The app records these events to compute your
            streaks, your heatmap and your weekly insights. They stay tied to
            your own account.
          </li>
          <li>
            <strong>Plan data</strong> — whether you are on Free or Pro. Card
            checkout is not live yet, so we hold no payment details at all; when
            billing ships, a payment provider will handle cards and we will not
            store full card numbers on our own servers.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use-it",
    heading: "How we use your data",
    body: (
      <>
        <p>We use it to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Run the onWard app and keep your account the same on every device you sign in from.</li>
          <li>Generate the streaks, insights and portfolio you asked for.</li>
          <li>Provide support and answer the messages you send us.</li>
          <li>Send essential service notices (plan changes, security, major changes).</li>
        </ul>
        <p>
          We do not sell your personal data, and we do not use your private
          content to train third-party AI models.
        </p>
      </>
    ),
  },
  {
    id: "legal-basis",
    heading: "Legal basis for processing",
    body: (
      <p>
        Where laws such as the GDPR or Nigeria&rsquo;s NDPA apply, we process
        data on the basis of (1) performance of our contract with you — providing
        the app; (2) your consent, which you can withdraw at any time; (3) our
        legitimate interests in securing and improving the product; and (4) legal
        obligation where required.
      </p>
    ),
  },
  {
    id: "storage-offline",
    heading: "Where your data lives",
    body: (
      <>
        <p>
          Your content lives in one place: a managed Postgres database (Supabase)
          that belongs to your onWard account. There is no separate copy kept on
          our servers beyond that, and no analytics warehouse holding your notes.
        </p>
        <p>
          onWard installs from the browser as an app, and we cache the interface
          so the screens still open with no signal. Saving does need a connection
          — there is no offline queue that quietly holds your entries and uploads
          them later. If you are signed out and offline, nothing is written
          anywhere.
        </p>
        <p>
          You need an account to use onWard. We do not offer an anonymous,
          on-device-only mode, so there is no &ldquo;your data never reaches
          us&rdquo; path to promise.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    heading: "Sharing and third parties",
    body: (
      <>
        <p>We only share data in these limited situations:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong>Service providers</strong> — hosting, database and auth that
            process data on our instructions under contract.
          </li>
          <li>
            <strong>Nothing is published by default</strong> — the share buttons
            in the app hand a link to your device&apos;s share sheet, but that
            link opens the sign-in screen for anyone who is not you; your content
            stays behind your account. There is no public profile, feed or
            portfolio link today, and the only thing that leaves your account is
            a portfolio PDF you choose to download and send yourself.
          </li>
          <li>
            <strong>Legal requests</strong> — if compelled by law, after we
            challenge anything we reasonably can.
          </li>
          <li>
            <strong>Business transfer</strong> — in a merger or acquisition, with
            notice before your data moves.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    heading: "Cookies and analytics",
    body: (
      <p>
        This website sets no advertising cookies and loads no third-party
        trackers — it is a static set of pages, and we do not watch where you
        click on them. The app keeps your sign-in session in your browser&rsquo;s
        local storage so you are not asked for a password on every visit. If we
        ever add analytics, this page gets updated before it goes live.
      </p>
    ),
  },
  {
    id: "retention",
    heading: "How long we keep data",
    body: (
      <p>
        We keep account and content data for as long as your account is active.
        There is no delete-my-account button in the app yet, so that one is on us:
        email {emailFor("privacy")} and we remove your account and everything
        attached to it, and tell you when it is done. Aggregate, de-identified
        statistics may persist.
      </p>
    ),
  },
  {
    id: "your-rights",
    heading: "Your rights and controls",
    body: (
      <>
        <p>You can, at any time and free of charge:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Read and correct everything you have logged, from inside the app.</li>
          <li>Download your portfolio as a PDF from the portfolio screen.</li>
          <li>Ask us for a copy of the rest of your data, in whatever shape we can export it.</li>
          <li>Ask us to delete your account and all associated content.</li>
          <li>Object to or restrict certain processing, and withdraw consent.</li>
        </ul>
        <p>
          For anything the app does not have a button for, email us. We respond
          within 30 days. You may also complain to your local data-protection
          authority.
        </p>
      </>
    ),
  },
  {
    id: "security",
    heading: "How we protect data",
    body: (
      <p>
        We use encryption in transit and at rest, least-privilege access, and
        privacy-by-default product design. See our{" "}
        <a href="/security" className="font-semibold text-lime-deep hover:underline">
          Security page
        </a>{" "}
        for the full picture. No system is perfectly secure, but we take
        reasonable, proportionate measures and disclose material incidents
        promptly.
      </p>
    ),
  },
  {
    id: "children",
    heading: "Children’s privacy",
    body: (
      <p>
        onWard is not directed at children under 16, and we do not knowingly
        collect their data. If you believe a child has given us personal data,
        contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "transfers",
    heading: "International transfers",
    body: (
      <p>
        Because we are a global, remote-first product, data may be processed
        outside Nigeria. Where we transfer data to another jurisdiction, we rely
        on appropriate safeguards such as standard contractual clauses and
        reputable providers located in recognised regions.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to this policy",
    body: (
      <p>
        If we make a material change, we will update the date above and, where it
        affects you meaningfully, notify you in-app or by email before it takes
        effect.
      </p>
    ),
  },
];

export default function Privacy() {
  return (
    <LegalLayout
      eyebrow="Privacy"
      title="Privacy Policy"
      updated="3 November 2026"
      subtitle="Your growth story belongs to you. Here is exactly what we collect, why, and how you stay in control."
      preamble={
        <p>
          This policy explains how GIGS Labs collects, uses, stores, shares and
          protects personal data when you use onWard and our website. It is
          written to be read by people, not just lawyers — if anything is
          unclear, ask us.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
