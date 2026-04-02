import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-[#042417] text-slate-100">
      <header className="border-b border-white/10 bg-[#042417]/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
          <Link to="/" className="flex items-center gap-2 text-lg font-black tracking-tight text-white hover:opacity-90">
            <Shield className="h-7 w-7 text-[#22c55e]" />
            Cynapse
          </Link>
          <Link to="/" className="text-sm font-semibold text-[#22c55e] hover:text-emerald-300">
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-20 text-slate-300">
        <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">Terms of Service</h1>
        <p className="text-sm text-slate-400">Last updated: April 2, 2026</p>

        <p>
          These Terms of Service (“Terms”) govern your access to and use of the Cynapse platform, websites, and related
          services (collectively, the “Services”) provided by Cynapse Inc. (“Cynapse,” “we,” “us,” or “our”). By accessing
          or using the Services, you agree to these Terms. If you are using the Services on behalf of an organization,
          you represent that you have authority to bind that organization, and “you” includes that organization.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">1. The Services</h2>
        <p>
          Cynapse provides enterprise software for product discovery, governance, and compliance-related workflows.
          Features, limits, and availability may depend on your subscription plan and order form. We may modify or
          discontinue features with reasonable notice where required by law or contract.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">2. Accounts and access</h2>
        <p>
          You must provide accurate registration information and safeguard your credentials. You are responsible for
          activity under your account. Notify us promptly of unauthorized use. We may suspend or terminate access for
          violations of these Terms or to protect the Services and other users.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">3. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul className="list-disc space-y-2 pl-6">
          <li>Violate applicable laws or third-party rights;</li>
          <li>Probe, scan, or test vulnerabilities without authorization, or circumvent security measures;</li>
          <li>Upload malware, interfere with the Services, or impose unreasonable load;</li>
          <li>Use the Services to build a competing product or scrape data except as permitted by API terms;</li>
          <li>Misrepresent identity or affiliation, or harass other users.</li>
        </ul>

        <h2 className="pt-4 text-xl font-bold text-white">4. Customer data</h2>
        <p>
          You retain rights to data you submit (“Customer Data”). You grant Cynapse a license to host, process, and
          display Customer Data solely to provide and improve the Services as described in your agreement and our Privacy
          Policy. You are responsible for the legality and accuracy of Customer Data and for obtaining necessary consents.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">5. Intellectual property</h2>
        <p>
          The Services, including software, branding, and documentation, are owned by Cynapse or its licensors. Except for
          the limited rights granted in these Terms, no rights are transferred to you. Feedback you provide may be used by
          Cynapse without obligation to you.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">6. Third-party services</h2>
        <p>
          The Services may integrate with third-party products. Those services are governed by their own terms. Cynapse is
          not responsible for third-party content or availability.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">7. Confidentiality</h2>
        <p>
          Each party may receive confidential information from the other. The receiving party will use reasonable care to
          protect it and use it only for the purposes of the relationship, subject to exceptions recognized by law.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">8. Disclaimers</h2>
        <p>
          THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE.” TO THE MAXIMUM EXTENT PERMITTED BY LAW, CYNAPSE DISCLAIMS
          ALL WARRANTIES, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND
          NON-INFRINGEMENT. CYNAPSE DOES NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED OR ERROR-FREE OR THAT
          COMPLIANCE OR REGULATORY OUTCOMES WILL BE ACHIEVED; YOU REMAIN RESPONSIBLE FOR YOUR OWN REGULATORY OBLIGATIONS.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">9. Limitation of liability</h2>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, NEITHER PARTY WILL BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL,
          CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR LOSS OF PROFITS, DATA, OR GOODWILL. EXCEPT FOR AMOUNTS DUE UNDER AN ORDER
          OR FOR A PARTY’S INDEMNITY OBLIGATIONS OR WILLFUL MISCONDUCT, EACH PARTY’S AGGREGATE LIABILITY ARISING OUT OF
          THESE TERMS WILL NOT EXCEED THE AMOUNTS PAID BY YOU TO CYNAPSE FOR THE SERVICES IN THE TWELVE MONTHS PRECEDING
          THE CLAIM (OR, IF NO FEES APPLY, ONE HUNDRED U.S. DOLLARS).
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">10. Indemnity</h2>
        <p>
          You will defend and indemnify Cynapse against claims arising from Customer Data, your use of the Services in
          violation of these Terms, or your violation of law or third-party rights, subject to standard procedural
          conditions.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">11. Term and termination</h2>
        <p>
          These Terms remain in effect while you use the Services. Enterprise subscriptions may be governed by a separate
          agreement with renewal and termination provisions. Upon termination, your right to access the Services ceases;
          we may delete data in accordance with our retention policy and your agreement.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">12. Governing law</h2>
        <p>
          These Terms are governed by the laws of the State of Delaware, excluding conflict-of-law rules, unless a
          mandatory law of your jurisdiction applies. Courts in Delaware (or as specified in your enterprise agreement)
          will have exclusive jurisdiction, except where prohibited.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">13. Changes</h2>
        <p>
          We may update these Terms. We will post the revised Terms and update the “Last updated” date. For material
          changes, we may provide additional notice. Continued use after the effective date constitutes acceptance unless
          applicable law requires otherwise.
        </p>

        <h2 className="pt-4 text-xl font-bold text-white">14. Contact</h2>
        <p>
          Questions about these Terms:{" "}
          <a href="mailto:legal@cynapse.com" className="font-semibold text-[#22c55e] hover:text-emerald-300">
            legal@cynapse.com
          </a>
          .
        </p>
      </main>
    </div>
  );
}
