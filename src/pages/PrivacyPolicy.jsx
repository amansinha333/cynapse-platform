import React from "react";
import { Link } from "react-router-dom";
import Logo, { LOGO_CLASS } from "../components/ui/Logo";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[#042417] text-slate-100">
      <header className="border-b border-white/10 bg-[#042417]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <Link to="/" className="flex shrink-0 items-center hover:opacity-90" aria-label="Cynapse home">
            <Logo className={LOGO_CLASS.marketing} variant="dark" />
          </Link>
          <Link to="/" className="text-sm font-semibold text-[#22c55e] hover:text-emerald-300">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-20 text-slate-300">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Privacy Policy</h1>
        <p className="text-sm text-slate-400">Last updated: April 2, 2026</p>

        <p>
          Cynapse Inc. (“Cynapse,” “we,” “us,” or “our”) operates the Cynapse platform and related websites and services
          (collectively, the “Services”). This Privacy Policy describes how we collect, use, disclose, and safeguard
          information when you use our Services, and your choices regarding that information.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">1. Scope</h2>
        <p>
          This policy applies to personal data we process in connection with the Services. If you use Cynapse on behalf of
          an organization, that organization’s agreement with us may also govern how we process certain data.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">2. Information we collect</h2>
        <p>We may collect:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>
            <strong className="text-slate-200">Account and contact data</strong> — name, work email, company name, role,
            and credentials you provide when you register or are invited.
          </li>
          <li>
            <strong className="text-slate-200">Usage and device data</strong> — log data, IP address, browser type,
            approximate location, and interactions with the Services (e.g., features viewed, timestamps).
          </li>
          <li>
            <strong className="text-slate-200">Content you submit</strong> — product initiatives, compliance artifacts,
            documents, and other materials you upload or create within the platform.
          </li>
          <li>
            <strong className="text-slate-200">Support communications</strong> — information you provide when you contact
            support or participate in surveys.
          </li>
        </ul>

        <h2 className="pt-4 text-xl font-bold text-white">3. How we use information</h2>
        <p>We use personal data to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Provide, operate, and improve the Services;</li>
          <li>Authenticate users and enforce security controls;</li>
          <li>Analyze usage to improve performance and user experience;</li>
          <li>Communicate about the Services, including transactional and service messages;</li>
          <li>Comply with legal obligations and respond to lawful requests.</li>
        </ul>

        <h2 className="pt-4 text-xl font-bold text-white">4. Legal bases (where applicable)</h2>
        <p>
          Where the GDPR or similar laws apply, we rely on appropriate bases such as contract performance, legitimate
          interests (balanced against your rights), consent where required, and legal obligation.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">5. Sharing and subprocessors</h2>
        <p>
          We may share information with service providers who assist us (e.g., hosting, analytics, email delivery) subject
          to contractual safeguards. We may disclose information if required by law or to protect rights, safety, and
          security. In a merger or acquisition, information may be transferred as part of that transaction.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">6. International transfers</h2>
        <p>
          If we transfer personal data across borders, we implement appropriate safeguards such as standard contractual
          clauses or other mechanisms recognized under applicable law.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">7. Retention</h2>
        <p>
          We retain personal data for as long as necessary to fulfill the purposes described in this policy, unless a longer
          period is required or permitted by law. Retention may depend on your organization’s settings and contractual
          requirements.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">8. Security</h2>
        <p>
          We implement administrative, technical, and organizational measures designed to protect personal data. No
          method of transmission or storage is completely secure; we encourage strong credentials and timely reporting of
          suspected issues.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">9. Your rights</h2>
        <p>
          Depending on your jurisdiction, you may have rights to access, correct, delete, or restrict processing of your
          personal data, or to object to certain processing or request portability. You may also withdraw consent where
          processing is consent-based. To exercise these rights, contact us using the details below. You may lodge a
          complaint with a supervisory authority where applicable.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">10. Cookies and similar technologies</h2>
        <p>
          We use cookies and similar technologies for essential operation, preferences, and analytics. You can control
          cookies through your browser settings and, where offered, through in-product controls.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">11. Children</h2>
        <p>The Services are not directed to children under 16, and we do not knowingly collect their personal data.</p>

        <h2 className="pt-4 text-xl font-bold text-white">12. Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. We will post the updated version and adjust the “Last
          updated” date. Material changes may be communicated through the Services or by email where appropriate.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">13. Contact</h2>
        <p>
          For privacy-related requests or questions, contact:{" "}
          <a href="mailto:privacy@cynapse.com" className="font-semibold text-[#22c55e] hover:text-emerald-300">
            privacy@cynapse.com
          </a>
          .
        </p>
      </main>
    </div>
  );
}
