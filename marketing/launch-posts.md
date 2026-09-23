# Launch posts (EN)

Drafts for the backlink / launch track. Written 2026-09-23. Facts match `README.md` and
`clockify-alternative/index.html`.

Rules that apply to all of them: no GDPR or EU-hosting claims, no "Clockify is expensive", state the
limitations up front. See [Facts and rules](./directory-listings.md#facts-and-rules).

---

## 1. Show HN

Post as **Show HN**, on a weekday morning US time, then stay in the thread for the first few hours —
that matters more than the copy. Put the text in the URL field's companion comment, not in the title.

### Title

HN titles are capped at 80 chars and the crowd punishes hype. Preferred:

```
Show HN: Time tracker that stores your team's hours in your private GitHub repo
```

(78 chars.) Alternates:

```
Show HN: Workaddict – team time tracking with a git repo as the database
Show HN: A team time tracker with no backend, using GitHub as storage
```

### URL

```
https://workaddict.me
```

### First comment

```
I built this after my team hit Clockify's free-plan user limit and I started looking at the
open-source options. All of them wanted me to run a server, which for a handful of people tracking
hours felt like a lot of machine to babysit.

So Workaddict has no backend at all. It's a static site on GitHub Pages, and the storage is a
private GitHub repository that you own. Entries are plain JSON, one file per person and month:

    tracker.json              schema version
    workspace.json            projects & tags
    roles.json                member roles
    entries/<login>/<YYYY-MM>.json
    timers/<login>.json       running timer

The browser talks to the GitHub REST API directly with a fine-grained token scoped to that one repo.
There's no Workaddict account, no server of mine in the path, and no analytics.

Two things fell out of this design that I didn't expect to like as much as I do:

1. Every change is a commit with a readable message (`entry: add 2h "Fix login" (alice)`), so the
   data repo is also an audit log. Someone fat-fingers a month, you `git revert`.
2. Writes don't collide, because each member only ever writes their own entry and timer files.
   `workspace.json` is the one shared file, and its writes retry on conflict.

Team members are just the collaborators on the repo, and roles (worker / editor / team leader) live
in `roles.json`. There's a timer that syncs across devices, projects and tags, statistics for any
date range, exports to PDF / Excel / ODS / CSV, English and German, light and dark. It imports
Clockify projects, tags and entries if you're coming from there.

The honest downsides: everyone needs a GitHub account, there are no native or offline apps, no
integrations, and no invoicing or approvals. It's built for small teams, and it stays that way.

There's a demo on the start page that needs no sign-up and saves nothing —
https://workaddict.me — and the source is AGPL-3.0 at
https://github.com/Workaddict/workaddict. Happy to go into the storage layout or the token
setup, which turned out to be the hardest part of the whole thing (see the other thread below if
anyone hits GitHub's org token approval).
```

### Prepared answers for likely questions

Have these ready; HN will ask all of them.

- **"Why not just a spreadsheet?"** — A spreadsheet doesn't give you a running timer that syncs from
  laptop to phone, per-member write isolation, or roles. And the git history is per-change, not
  per-save.
- **"API rate limits?"** — Fine-grained tokens get the authenticated REST limit. One person's day of
  tracking is a handful of writes; the Clockify import paces itself. It would be the wrong tool for
  hundreds of people.
- **"What if two people edit at once?"** — They can't hit the same file: entries and timers are
  per-login. `workspace.json` (projects and tags) is shared and retries on conflict.
- **"Isn't putting your data on GitHub the same problem?"** — It's the same *company*, but not the
  same arrangement: it's your repo, under your account, exportable with `git clone`, and you can
  host the static app yourself. No GDPR or data-residency claim from me — GitHub is a US company.
- **"Why AGPL?"** — It's a hosted web app; AGPL keeps modified hosted versions open.
- **"Scaling / repo size?"** — One JSON file per person per month keeps files small, but a very large
  team over many years is not what this is for.

---

## 2. dev.to article

### Working title

```
Using a git repo as the database for a team time tracker
```

Alternates: "No backend, no database: a time tracker built on the GitHub API", "What I learned
putting a team's timesheets in git".

### Angle

Not a product post. A design write-up where the product is the example. The interesting content is
the trade-offs of git-as-storage, which is a genuinely underused pattern, plus the token/permission
mess, which is the part nobody writes about.

### Outline

1. **The constraint that started it** — small team, Clockify's free plan limited to 5 active users in
   April 2026, and every open-source alternative needs a server. What if there is no server?
2. **The idea** — static site + GitHub API + a private repo as the database. Show the file layout
   (the tree from the README).
3. **Why one file per person per month** — the concurrency trick: members never write the same file,
   so most conflicts are designed away rather than resolved. `workspace.json` is the exception and
   retries.
4. **Commits as the audit log** — human-readable commit messages
   (`entry: add 2h "Fix login" (alice)`), `git revert` as undo, `git clone` as backup and as the
   escape hatch. This is the part that turned out best.
5. **What git-as-a-database is bad at** — no queries (you fetch files and filter in the browser), no
   transactions across files, latency per write, rate limits, and schema migrations you have to do
   yourself (`tracker.json` holds a schema version for exactly this).
6. **The hard part was permissions, not storage** — fine-grained tokens scoped to one repo; new
   GitHub organizations require an owner to **approve** fine-grained tokens by default, and the
   owner's own token is exempt, so the owner never sees the problem while every member gets an
   unexplained 404. How the app now diagnoses that instead of dead-ending. (Good, specific, hard-won
   detail — this is the section that earns the post.)
7. **Security posture** — token in the browser only, scoped to one repo, no server to breach, strict
   CSP, no analytics. And what that costs: no secrets can live in the app, so no integrations.
8. **Would I do it again?** — Yes for small teams and data you want to own; no for anything that
   needs queries, offline, or dozens of writers.
9. **Links** — demo, repo, the Clockify import guide.

### Notes

- Include the file-tree block and one real commit message; concrete artifacts carry this kind of post.
- Cross-post the same piece to the repo as a `docs/` page or a GitHub Discussion so the canonical
  copy is ours; set the dev.to canonical URL to it.
- Keep it to ~1,200–1,600 words. Section 6 is the one to write first.

---

## 3. Reddit

Low-frequency, high-usefulness. Do not post the same text in three subs, and do not post at all in a
week where you can't reply to comments.

| Subreddit        | Angle                                                                               | Caution                                                                  |
| ---------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| r/opensource     | The design post (git as database, AGPL, self-hostable). Closest to a good fit.       | Read the self-promotion rule; some weeks it needs a flair or a mod nod.   |
| r/selfhosted     | The inversion: "self-hosted without a server to host". Honest that storage is GitHub. | Half the sub will object to depending on GitHub. Expected; answer calmly. |
| r/freelance      | Only as an answer in an existing "how do you track hours" thread.                    | A standalone launch post reads as spam here.                             |
| r/smallbusiness  | Same — comment, don't post.                                                          | Strict on promotion. Lowest priority.                                     |

### r/opensource post draft

**Title:** `Workaddict: a team time tracker that uses a private GitHub repo as its database (AGPL-3.0)`

```
My team hit Clockify's free-plan user limit, and every open-source time tracker I looked at (Kimai,
solidtime, Cattr) needed a server. For five people logging hours, running and updating a server felt
like the wrong amount of infrastructure, so I tried building one with no backend at all.

Workaddict is a static site. Storage is a private GitHub repository you own: entries are JSON files,
one per person per month, written straight from the browser through the GitHub API with a
fine-grained token scoped to that one repo. Every change is a commit with a readable message, so the
repo doubles as an audit log you can revert, and `git clone` is both your backup and your way out.

It has a timer that syncs across devices, projects and tags, statistics for any date range, roles
(worker / editor / team leader), a live team view, exports to PDF / Excel / ODS / CSV, and an
importer for Clockify projects, tags and entries. English and German, light and dark.

Trade-offs, up front: everyone needs a GitHub account, there's no offline mode and no native apps, no
integrations, and no invoicing or approvals. And your data is on GitHub — it's your repo under your
account, but it's still a US company, so I'm not making any data-residency claims.

Demo without sign-up: https://workaddict.me
Source (AGPL-3.0): https://github.com/Workaddict/workaddict

Happy to talk about the storage layout or why per-member files make the concurrency mostly go away.
```

### Comment template (for existing "how do you track time" threads)

```
If you want the data to stay yours, I maintain an open-source one that stores entries as JSON in
your own private GitHub repo instead of on a vendor's servers — no server to run, free, no user
limit: https://workaddict.me (AGPL-3.0). Caveats: everyone needs a GitHub account and there's no
offline or mobile app. Not a fit for everyone, but it might be for what you described.
```

Disclose authorship every time ("I maintain"). One comment per thread, no follow-up plugs.

---

## Sequencing

```
week 1   directory submissions (fast, feeds AI answers too)
         + capture the missing screenshots first
week 2   dev.to / repo design post  ──┐
week 3   Show HN, linking the post ───┘  (HN goes better with something to read)
week 4   r/opensource, then r/selfhosted a week later
ongoing  Reddit comments in existing threads only
```

Check Search Console → Performance before each step and let the real queries steer the next one.
