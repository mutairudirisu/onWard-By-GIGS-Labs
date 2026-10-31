import type { Metadata } from "next";
import { LegalLayout, type LegalSection } from "@/components/legal";

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
            href="mailto:privacy@gigslabs.example"
            className="font-semibold text-lime-deep hover:underline"
          >
            privacy@gigslabs.example
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
            <strong>Device &amp; sync data</strong> — device type, app version,
            and the technical identifiers needed to sync across your devices.
          </li>
          <li>
            <strong>Usage data</strong> — aggregate, product-improvement signals
            such as which features are used. We aim for privacy-preserving,
            cohort-level analytics rather than individual profiling.
          </li>
          <li>
            <strong>Billing data</strong> — plan and payment status. Card numbers
            are handled by our payment provider; we do not store full card
            details on our own servers.
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
          <li>Run, secure and sync the onWard app across your devices.</li>
          <li>Generate the streaks, insights and portfolio you asked for.</li>
          <li>Provide support and answer the messages you send us.</li>
          <li>Improve the product using aggregate, de-identified trends.</li>
          <li>Send essential service notices (billing, security, major changes).</li>
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
      <p>
        onWard is offline-first: your content is written to your device first and
        synced to our servers when you are connected and signed in. Synced data
        is stored encrypted at rest on infrastructure in vetted regions. You can
        use the app without an account, in which case your data stays on-device
        and never reaches us.
      </p>
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
            <strong>Service providers</strong> — hosting, email and payments who
            process data on our instructions under contract.
          </li>
          <li>
            <strong>Links you create</strong> — a portfolio or streak you
            explicitly share becomes visible to whoever holds the link. You can
            revoke any share link at any time.
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
        The website uses essential cookies to function and privacy-respecting,
        aggregate analytics to understand which pages help people. We avoid
        cross-site advertising trackers. You can clear or block cookies in your
        browser at any time; the app itself relies on local storage rather than
        cookies.
      </p>
    ),
  },
  {
    id: "retention",
    heading: "How long we keep data",
    body: (
      <p>
        We keep account and content data for as long as your account is active.
        If you delete your account, we remove your content from our systems
        within 30 days, except where we must retain limited records for legal or
        accounting obligations. Aggregate, de-identified statistics may persist.
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
          <li>Access and export your full history from within the app.</li>
          <li>Correct or update your profile and content.</li>
          <li>Delete your account and all associated content.</li>
          <li>Revoke any share link you have created.</li>
          <li>Object to or restrict certain processing, and withdraw consent.</li>
        </ul>
        <p>
          To exercise a right, use the in-app controls or email us. We respond
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
      updated="29 October 2026"
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
