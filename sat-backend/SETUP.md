# Secure SAT grading setup

The implementation is ready for deployment, but it is not a live grading service. The public client deliberately has no grading fallback. Until the following setup is completed, existing responses can be resumed, but submissions and teacher sign-in cannot be graded locally.

## Hosting and credentials required

1. Deploy `sat-backend/server.cjs` on a private-runtime Node 24.12+ web service behind HTTPS. `sat-backend/render.yaml` is a ready-to-configure Render Blueprint; select that file's path when creating the Blueprint. Its paid service and persistent disk are required by this configuration. No provider account, payment, domain change, or deployment was created in this task.
2. Set `SAT_DB_PATH` to an absolute path on an attached private persistent volume, such as `/var/data/sat.sqlite`. Run one service instance against this SQLite volume. Do not place the database under any static site directory. Back it up privately and restrict provider account access.
3. Choose a NEW unique teacher password of at least 16 characters. Generate its scrypt digest locally with `node sat-backend/hash-password.cjs`, supplying the password through stdin. The helper never takes the password as a command-line argument. For example, in zsh:

   ```sh
   read -s 'SAT_SETUP_PASSWORD?New teacher password: '
   printf '%s' "$SAT_SETUP_PASSWORD" | node sat-backend/hash-password.cjs
   unset SAT_SETUP_PASSWORD
   ```

   Put the resulting digest in the hosting provider's **secret** environment variable `SAT_TEACHER_PASSWORD_HASH`. Do not put the password or digest into website files, GitHub variables, HTML, or chat. The old public access code is no longer accepted. Teacher sessions expire after one hour and are revoked on explicit sign-out.
4. Put the contents of the preserved local `.sat-private/answer-keys.json` into the provider's **secret** environment variable `SAT_KEYS_JSON`. This file contains the four existing keys and is ignored by Git. Never commit it, add it to a Pages artifact, or attach it to a public issue. Initial keys are imported only when that test has no stored key; later teacher edits live in SQLite and are not overwritten at restart. Keep a private backup. For future papers, enter their complete keys through authenticated teacher tools or seed them privately.
5. Set `SAT_ALLOWED_ORIGINS` to the exact production origin(s), comma separated: normally `https://www.huskydaddy.com,https://huskydaddy.com`. Add a preview origin explicitly if needed; do not use `*`. The API sends no cookies and allows no credentialed cross-origin requests. Add provider edge rate limiting to teacher login and student routes. The application also throttles logins and student requests; behind a proxy its socket-based limits may group multiple users together.
6. Set the public URL in `pages/SAT/shared/api-config.js`, for example `window.SAT_API_BASE = 'https://your-grading-service.example';`. This is a URL only; it contains no credentials.
7. In GitHub repository **Settings → Pages**, select **GitHub Actions** as the publishing source. The supplied `.github/workflows/pages.yml` builds `.site-public` and publishes only static site content. The private backend, ignored key seed, tests, tools, database, and Git history are excluded. `_config.yml` also excludes backend/private directories for older Jekyll configurations. Do not publish the repository root with an arbitrary file-copy server.
8. Before rollout, privately back up any browser-only teacher key overrides and re-enter them through the authenticated key editor. The private seed preserves repository keys, not edits made only in a teacher's old browser. Then deploy the API first, configure its secrets, then publish the updated client. Confirm HTTPS, CORS, teacher login, code creation, student submission, teacher key editing, logout, expiry, and anonymous rejection against the live service. Re-run all checks listed below. Review hosting logs for errors without enabling request-body or Authorization logging.

## Teaching and student flow

Open any SAT set → Teacher → sign in with the new password. Keys and all submitted attempts load only after server authentication. Create a named **one-submission code** and share it privately with the student; codes expire after 30 days. A lost code cannot be recovered from the server because only its hash is stored—issue a new code instead.

Students enter their issued code to start. Progress, selected responses, marks for review, cross-outs, and remaining time remain separate per test on the student's device. The issued code is kept only in that tab's session storage so the submitted result can load on the next page. It permits access only to that one student's attempt, never teacher data. Do not share the code between students.

After both modules, the server grades all 54 responses. Missing responses count as incorrect and are labelled Unanswered. Students receive total/module raw counts and question statuses only. They do not receive answer letters, keys, explanations, or teacher notes. Submitting changed responses with the same code is rejected; retrying an identical submission is safe. Results are fetched from the server, not trusted from editable local scores.

Teachers can review full keys, edit the server key, see submitted student responses, skill summaries, and full question/answer reviews. Saving a key regrades existing server attempts. Return to test preserves the current question. An authenticated teacher can start a teaching demonstration without manually entering a code; the service issues a private attempt for that name. Temporary red ink remains memory-only and question-specific. Logout/session expiry locks the pen, clears drawings and teacher DOM content, and discards the teacher bearer token.

## Migration and limitations

- Old public keys, the hard-coded teacher access code, and answer-bearing legacy clients are removed from the current public source. On a visit to an updated test/results page, old key storage entries and embedded key/question snapshots in stored attempts are stripped. Student responses and saved progress remain. Historical local-only attempts and their selected responses remain preserved locally. Authenticated teachers can use Import earlier attempts from this browser to copy and regrade them on the server. Import is teacher-only and deduplicated; it does not issue a student access code for historical results.
- Already published keys are **already disclosed**. Git history, previous deployments, browser caches, downloaded files, and third-party copies cannot be made secret retroactively. This change protects new API access; it does not make the four historical keys unknown again. Git history was not rewritten. For high-stakes reuse, replace exposed papers/keys; future keys must never enter the public repository.
- Correct/incorrect feedback necessarily tells a student whether their own submitted choice was right. One immutable submission per teacher-issued code limits probing, but students can still share feedback or issued codes. This is a practice service, not exam proctoring.
- Teacher passwords use scrypt and server-side verification, with hashed random expiring bearer sessions. Sessions are kept in JavaScript memory only. This implementation has one teacher account and no MFA or password-reset service. A teacher's compromised device or an XSS vulnerability on the website could still expose an authenticated session. Use a well-secured hosting account, HTTPS, and restricted site editing access.
- Browser storage on devices that never revisit the updated site cannot be remotely erased. Teacher keys from those old clients remain disclosed. Normal student response storage is not an authentication authority.
- The API does not serve static files. Requests for database files, seeds, or teacher routes without valid teacher authentication are denied or not found. Keep runtime storage outside the static host and restrict provider access.
- No validated raw-to-scaled conversion exists in this repository. Results show raw counts and percentages only.
- Live deployment, external TLS/CORS, and browser/touch layout verification still need a configured host. Local preview sockets are blocked in this session. HTTP application tests invoke the real request handler, not a listening network server.

## Checks

```sh
python3 tools/build-sat-public.py
node tools/check-sat-tests.cjs
node tools/check-sat-security.cjs
node tools/check-sat-client-security.cjs
node tools/check-sat-teacher-ink.cjs
node tools/check-sat-public.cjs
```

The security tests use synthetic keys, never the real private seed. They cover all four sets, server grading, module totals, blank responses, immutable submissions, same-payload retries, wrong-test access, student-token misuse, missing/invalid/expired teacher sessions, old-code rejection, CORS, login throttling, persistent data, teacher-only key changes/review, and regrading. Client tests cover response preservation, key cleanup, memory-only teacher credentials, stale-response rejection after logout, results rendering, navigation, retry/resume, and pen lifecycle.

Implementation references: [Node crypto](https://nodejs.org/api/crypto.html), [Node SQLite](https://nodejs.org/api/sqlite.html), [Render persistent disks](https://render.com/docs/disks), [GitHub Pages publishing sources](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).
