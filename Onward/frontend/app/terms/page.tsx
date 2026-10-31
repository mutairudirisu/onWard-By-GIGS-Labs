import type { Metadata } from "next";
import { LegalLayout, type LegalSection } from "@/components/legal";

export const metadata: Metadata = {
  title: "Terms of Service — GIGS Labs",
  description:
    "The terms that govern your use of onWard and the GIGS Labs website — accounts, content, subscriptions, acceptable use and more.",
};

const SECTIONS: LegalSection[] = [
  {
    id: "acceptance",
    heading: "Acceptance of these terms",
    body: (
      <p>
        By creating an account, using the onWard app, or browsing this website,
        you agree to these Terms of Service and our{" "}
        <a href="/privacy" className="font-semibold text-lime-deep hover:underline">
          Privacy Policy
        </a>
        . If you do not agree, please do not use the service.
      </p>
    ),
  },
  {
    id: "the-service",
    heading: "What onWard is",
    body: (
      <p>
        onWard is a work-documentation application delivered as a web app and
        installable PWA. We may add, change or retire features over time. We aim
        to keep the service available, but it is provided on a reasonable-efforts
        basis and we may need to pause it for maintenance or business reasons.
      </p>
    ),
  },
  {
    id: "accounts",
    heading: "Your account",
    body: (
      <ul className="list-disc space-y-1.5 pl-5">
        <li>You must provide accurate information and keep it up to date.</li>
        <li>You are responsible for activity on your account — keep credentials safe.</li>
        <li>Accounts are personal; do not share or resell access.</li>
        <li>You must be at least 16 years old to use the service.</li>
      </ul>
    ),
  },
  {
    id: "your-content",
    heading: "Your content and data",
    body: (
      <>
        <p>
          You own everything you create in onWard — tasks, notes, onWards and
          portfolio entries. You grant us a limited licence to store, sync, back
          up and display it solely to operate the service for you.
        </p>
        <p>
          You are responsible for the content you create and share, and you must
          have the rights to any material you upload. You can export your data at
          any time.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    heading: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Break, reverse-engineer or overload the service.</li>
          <li>Use it to store or share unlawful, harmful or infringing material.</li>
          <li>Impersonate others or create accounts to evade a suspension.</li>
          <li>Scrape or resell the service or others&rsquo; data without permission.</li>
        </ul>
      </>
    ),
  },
  {
    id: "plans-billing",
    heading: "Plans, subscriptions and billing",
    body: (
      <>
        <p>
          onWard offers a Free plan and paid plans (Grow and, later, Teams). All
          prices are shown in Nigerian Naira (&#8358;) on the{" "}
          <a href="/pricing" className="font-semibold text-lime-deep hover:underline">
            pricing page
          </a>
          .
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Paid plans renew automatically until you cancel.</li>
          <li>You can cancel anytime; your plan runs to the end of the period.</li>
          <li>Fees are charged in advance and are non-refundable except where the law requires or we choose to make an exception.</li>
          <li>Prices may change with notice; existing periods are honoured.</li>
          <li>Taxes may be added where applicable.</li>
        </ul>
      </>
    ),
  },
  {
    id: "free-plan",
    heading: "Your data is never held hostage",
    body: (
      <p>
        If you downgrade or stop paying, your Free plan keeps your full history
        and export rights. Upgrading adds capability; it never locks you out of
        your own growth story.
      </p>
    ),
  },
  {
    id: "intellectual-property",
    heading: "Intellectual property",
    body: (
      <p>
        The onWard name, logo, sprout mark, design and software are owned by
        GIGS Labs and protected by law. These terms do not grant you any right to
        use our brand beyond accurate, unaltered references in editorial coverage
        (see the{" "}
        <a href="/press" className="font-semibold text-lime-deep hover:underline">
          press kit
        </a>
        ).
      </p>
    ),
  },
  {
    id: "third-parties",
    heading: "Third-party services",
    body: (
      <p>
        The service may depend on third parties such as app stores, hosting and
        payment providers. Their own terms can apply to those parts, and we are
        not responsible for services we do not control.
      </p>
    ),
  },
  {
    id: "disclaimers",
    heading: "Disclaimers",
    body: (
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as
        available&rdquo;. We do not warrant that it will be uninterrupted or
        error-free. You are responsible for keeping your own backups of anything
        critical, though we make exporting easy.
      </p>
    ),
  },
  {
    id: "liability",
    heading: "Limitation of liability",
    body: (
      <p>
        To the maximum extent permitted by law, GIGS Labs is not liable for
        indirect or consequential loss, and our total liability for any claim is
        limited to the greater of the fees you paid in the preceding twelve
        months or a nominal amount where you are on the Free plan. Nothing here
        limits liability that cannot lawfully be limited.
      </p>
    ),
  },
  {
    id: "termination",
    heading: "Suspension and termination",
    body: (
      <p>
        You can close your account at any time. We may suspend or terminate
        access if you materially breach these terms, abuse the service, or where
        we are legally required to. On termination you may export your data for a
        reasonable window unless termination is for unlawful content.
      </p>
    ),
  },
  {
    id: "changes",
    heading: "Changes to these terms",
    body: (
      <p>
        We may update these terms as the product and law evolve. For material
        changes we will give reasonable notice in-app or by email. Continuing to
        use onWard after changes take effect means you accept them.
      </p>
    ),
  },
  {
    id: "governing-law",
    heading: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of the Federal Republic of Nigeria,
        without regard to conflict-of-law rules, and disputes are subject to the
        courts of Lagos — except where consumer-protection law in your country
        gives you other mandatory rights.
      </p>
    ),
  },
  {
    id: "contact-legal",
    heading: "Contact",
    body: (
      <p>
        Questions about these terms? Reach us at{" "}
        <a
          href="mailto:legal@gigslabs.example"
          className="font-semibold text-lime-deep hover:underline"
        >
          legal@gigslabs.example
        </a>{" "}
        or through the{" "}
        <a href="/contact" className="font-semibold text-lime-deep hover:underline">
          contact page
        </a>
        .
      </p>
    ),
  },
];

export default function Terms() {
  return (
    <LegalLayout
      eyebrow="Terms"
      title="Terms of Service"
      updated="29 October 2026"
      subtitle="The plain-language agreement between you and GIGS Labs for using onWard."
      preamble={
        <p>
          These terms set out what you can expect from us and what we ask of you.
          They are written to be fair to a small company and to the people who
          trust it with their daily effort.
        </p>
      }
      sections={SECTIONS}
    />
  );
}
