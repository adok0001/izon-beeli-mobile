import type { Metadata } from "next";
import Link from "next/link";

const APP_NAME = "Beeli (Aurufie)";

export const metadata: Metadata = {
  title: `Privacy Policy | ${APP_NAME}`,
  description:
    "Learn how Beeli collects, uses, and protects your personal data.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: `Privacy Policy | ${APP_NAME}`,
    description: "Learn how Beeli collects, uses, and protects your personal data.",
    url: "/privacy",
    type: "article",
  },
};

const LAST_UPDATED = "27 March 2026";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/learn"
          className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
        >
          ← Back to Beeli
        </Link>

        <h1 className="mt-8 font-display font-bold text-4xl tracking-tight">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Last updated: {LAST_UPDATED}
        </p>

        <div className="mt-10 space-y-10 text-base leading-relaxed text-neutral-700 dark:text-neutral-300">
          {/* 1 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              1. Who We Are
            </h2>
            <p>
              Beeli (Aurufie) (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;)
              is a language-learning platform dedicated to the preservation and
              revitalisation of African languages. Our services are available
              via the Beeli (Aurufie) mobile app (iOS and Android) and the Beeli (Aurufie) web
              application at{" "}
              <a href="https://izon-beeli.com" className="text-blue-600 dark:text-blue-400 hover:underline">izon-beeli.com</a>.
            </p>
            <p className="mt-3">
              For privacy-related questions or data requests, contact us at:{" "}
              <a href="mailto:support@izon-beeli.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@izon-beeli.com</a>
            </p>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              2. Age Requirement
            </h2>
            <p>
              Beeli (Aurufie) is intended for users aged 13 and over. We do not knowingly
              collect personal information from children under 13. If you
              believe a child under 13 has provided us with personal data,
              please contact us immediately and we will delete it.
            </p>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              3. Information We Collect
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Account Information
                </h3>
                <p className="mt-1">
                  When you create an account, we collect your name, email
                  address, and a username. Authentication is handled by Clerk
                  (see Section 7).
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Learning Activity
                </h3>
                <p className="mt-1">
                  We record lesson completions, quiz results, vocabulary saved
                  to your word bank, daily streaks, XP points, and journal
                  entries to power your personalised learning experience.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Audio Recordings (Microphone)
                </h3>
                <p className="mt-1">
                  If you choose to contribute vocabulary audio, we access your
                  device microphone solely to record your submission. Recordings
                  are uploaded to secure cloud storage and reviewed by Beeli
                  moderators before being published to the community dictionary.
                  Microphone access is only requested when you initiate a
                  recording — we do not record passively.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Community Content
                </h3>
                <p className="mt-1">
                  Posts, comments, and likes you make in the community feed are
                  stored on our servers and visible to other users.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Push Notification Tokens
                </h3>
                <p className="mt-1">
                  If you grant permission for push notifications, we store a
                  device push token to send you daily word reminders and streak
                  alerts. You can revoke this permission at any time via your
                  device settings or the in-app notification settings.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Usage &amp; Analytics
                </h3>
                <p className="mt-1">
                  We collect anonymised event data (e.g. lesson started, quiz
                  finished) to understand how the app is used and to improve it.
                  This data is not linked to identifiable individuals.
                </p>
              </div>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              4. How We Use Your Information
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Provide and personalise the learning experience</li>
              <li>Track your progress, streaks, and achievements</li>
              <li>
                Operate the community feed, leaderboards, and multiplayer
                features
              </li>
              <li>
                Moderate vocabulary contributions for quality and accuracy
              </li>
              <li>
                Send you push notifications you have opted into (e.g. Word of
                the Day, streak reminders)
              </li>
              <li>Improve the app through anonymised analytics</li>
              <li>Respond to support requests</li>
              <li>
                Comply with legal obligations under Nigerian, EU (GDPR), and
                California (CCPA) law
              </li>
            </ul>
            <p className="mt-3">
              We do not sell your personal data to third parties.
            </p>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              5. Data Sharing
            </h2>
            <p>
              We share data only in the following limited circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <span className="font-medium text-neutral-900 dark:text-white">
                  Service providers:
                </span>{" "}
                We use third-party services to operate the platform (listed in
                Section 7). These processors access only the data necessary to
                perform their services and are bound by data processing
                agreements.
              </li>
              <li>
                <span className="font-medium text-neutral-900 dark:text-white">
                  Community features:
                </span>{" "}
                Your username, XP level, streak count, contributions, and feed
                activity are visible to other users within the app.
              </li>
              <li>
                <span className="font-medium text-neutral-900 dark:text-white">
                  Legal requirements:
                </span>{" "}
                We may disclose data if required by law or to protect the rights
                and safety of users.
              </li>
            </ul>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              6. Data Retention
            </h2>
            <p>
              We retain your account data for as long as your account is active.
              Upon account deletion (see Section 8), your data enters a 30-day
              grace period during which you can restore your account. After that
              window closes, we permanently delete your profile, learning
              progress, journal entries, word bank, feed activity, and push
              tokens. Audio contributions accepted into the community dictionary
              will also be removed.
            </p>
            <p className="mt-3">
              Anonymised analytics data (with no link to your identity) may be 
              retained indefinitely for research and improvement purposes.
            </p>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              7. Third-Party Services
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Clerk (Authentication)
                </h3>
                <p className="mt-1">
                  Account creation, sign-in, and session management are handled
                  by Clerk, Inc. Clerk stores your email address, name, and
                  authentication credentials. See{" "}
                  <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Clerk&rsquo;s Privacy Policy</a>.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Neon (Database)
                </h3>
                <p className="mt-1">
                  Your learning data is stored in a PostgreSQL database hosted
                  by Neon, Inc. on servers in the United States. See{" "}
                  <a href="https://neon.tech/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Neon&rsquo;s Privacy Policy</a>.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Vercel (Hosting &amp; File Storage)
                </h3>
                <p className="mt-1">
                  The web app and API are hosted on Vercel. Audio contribution
                  files are stored using Vercel Blob. See{" "}
                  <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Vercel&rsquo;s Privacy Policy</a>.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  PartyKit (Real-Time Multiplayer)
                </h3>
                <p className="mt-1">
                  Multiplayer quiz sessions use PartyKit for real-time
                  WebSocket connections. Only your username and in-session game
                  state are transmitted during an active session. See{" "}
                  <a href="https://www.partykit.io/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">PartyKit&rsquo;s Privacy Policy</a>.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-white">
                  Apple &amp; Google Push Notification Services
                </h3>
                <p className="mt-1">
                  Push notifications are delivered via Apple Push Notification
                  service (APNs) and Google Firebase Cloud Messaging (FCM),
                  which process your device token to route notifications.
                </p>
              </div>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              8. Account Deletion
            </h2>
            <p>
              You can delete your Beeli account and all associated personal data
              at any time from within the app:
            </p>
            <ol className="list-decimal pl-5 space-y-1 mt-3">
              <li>Open the app and go to your Profile.</li>
              <li>
                Tap <strong>Settings</strong>.
              </li>
              <li>
                Scroll to the <strong>Account</strong> section and tap{" "}
                <strong>Delete Account</strong>.
              </li>
              <li>Confirm the deletion in the prompt.</li>
            </ol>
            <p className="mt-3">
              When you request deletion your account enters a{" "}
              <strong>30-day grace period</strong>. During this window you can
              sign back in to the app and tap <strong>Restore My Account</strong>{" "}
              to cancel the deletion and recover all your data instantly.
            </p>
            <p className="mt-3">
              After 30 days the deletion is irreversible. We will permanently
              remove your profile, progress, journal entries, word bank, feed
              posts, audio contributions, and push tokens.
            </p>
            <p className="mt-3">
              You may also request deletion by emailing{" "}
              <a href="mailto:support@izon-beeli.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@izon-beeli.com</a>.
              {" "}We will process your request within 30 days.
            </p>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              9. Your Rights
            </h2>
            <p>
              Depending on your location, you may have the following rights
              regarding your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>
                <span className="font-medium text-neutral-900 dark:text-white">
                  Access:
                </span>{" "}
                Request a copy of the data we hold about you.
              </li>
              <li>
                <span className="font-medium text-neutral-900 dark:text-white">
                  Correction:
                </span>{" "}
                Request correction of inaccurate data.
              </li>
              <li>
                <span className="font-medium text-neutral-900 dark:text-white">
                  Deletion:
                </span>{" "}
                Request deletion of your account and personal data (see Section 8).
              </li>
              <li>
                <span className="font-medium text-neutral-900 dark:text-white">
                  Portability:
                </span>{" "}
                Request a structured export of your data.
              </li>
              <li>
                <span className="font-medium text-neutral-900 dark:text-white">
                  Opt-out:
                </span>{" "}
                Opt out of push notifications at any time via device settings or
                in-app notification preferences.
              </li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a href="mailto:support@izon-beeli.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@izon-beeli.com</a>.
            </p>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              10. Security
            </h2>
            <p>
              We use industry-standard security measures including HTTPS
              encryption in transit, secure token-based authentication via
              Clerk, and access-controlled cloud storage. While we take
              reasonable precautions, no system is perfectly secure, and we
              cannot guarantee absolute security.
            </p>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              11. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. When we do,
              we will update the &ldquo;Last updated&rdquo; date at the top of
              this page. Continued use of the app after changes constitutes
              acceptance of the updated policy.
            </p>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-3">
              12. Contact Us
            </h2>
            <p>
              For any privacy-related questions, data requests, or concerns,
              please contact:
            </p>
            <p className="mt-3">
              <strong className="text-neutral-900 dark:text-white">Beeli</strong>
              <br />
              <a href="mailto:support@izon-beeli.com" className="text-blue-600 dark:text-blue-400 hover:underline">support@izon-beeli.com</a>
              <br />
              <a href="https://izon-beeli.com" className="text-blue-600 dark:text-blue-400 hover:underline">izon-beeli.com</a>
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-400 dark:text-neutral-500">
          <span>© {new Date().getFullYear()} Beeli. All rights reserved.</span>
          <Link
            href="/support"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Support
          </Link>
        </div>
      </div>
    </main>
  );
}
