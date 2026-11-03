import type { Metadata } from "next";
import { LegalLayout, type LegalSection } from "@/components/legal";
import { emailFor, mailto } from "@/lib/site";

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
          have the rights to any material you attach. Today the app gives you your
          portfolio as a PDF download; a full data export is not shipped yet, so
          ask us and we will pull what you need.
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
          onWard has two plans: Free and Pro. Prices are shown in Nigerian Naira
          (&#8358;) on the{" "}
          <a href="/pricing" className="font-semibold text-lime-deep hover:underline">
            pricing page
          </a>
          , and students with the Student role set in the app pay half price while
          that role stands.
        </p>
        <p>
          To be straight with you: card checkout is not live yet. The upgrade
          screen changes your plan without charging anything, so no money has
          changed hands and none of the clauses below have bitten yet. When we turn
          billing on, these are the terms it will run under.
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
        If you downgrade or stop paying, the Free plan still carries unlimited
        tasks and notes and keeps everything you have ever logged readable. What
        changes is capability — onWards per month, reminders, evidence on an onWard
        and the depth of your insights history — not access to your own history.
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
        The service depends on third parties we do not own — the hosting and
        database provider that runs onWard and the identity provider behind Google
        sign-in, and, once checkout ships, a payment provider. Their own terms can
        apply to those parts, and we are not responsible for services we do not
        control. onWard is not on an app store: it is a web app you install from
        the browser.
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
        error-free. You are responsible for keeping your own copies of anything
        critical — download the portfolio PDF when it matters to you, and do not
        treat a young product&rsquo;s database as your only archive.
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
        You can ask us to close your account at any time — there is no
        delete-account button in the app yet, so it is one email and we confirm it
        back to you. We may suspend or terminate access if you materially breach
        these terms, abuse the service, or where we are legally required to. If
        your access ends, ask us for your data and we will hand over what we hold —
        your portfolio and whatever else is in your account — for a reasonable
        window.
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
          href={mailto("legal")}
          className="font-semibold text-lime-deep hover:underline"
        >
          {emailFor("legal")}
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
      updated="3 November 2026"
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
