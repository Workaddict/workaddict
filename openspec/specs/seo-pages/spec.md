# seo-pages Specification

## Purpose
TBD - created by archiving change seo-landing-pages. Update Purpose after archive.
## Requirements
### Requirement: Search landing pages
The site SHALL serve four static pages as real HTML files that are readable without JavaScript: `https://workaddict.me/clockify-alternative/` (English) and `https://workaddict.me/de/clockify-alternative/` (German), which present Workaddict as a free, open-source Clockify alternative that needs no server, and `https://workaddict.me/import-from-clockify/` (English) and `https://workaddict.me/de/import-from-clockify/` (German), which explain how to move from Clockify with the built-in import. Each page SHALL have exactly one `<h1>` and SHALL run no JavaScript.

#### Scenario: Page served without JavaScript
- **WHEN** a crawler requests `https://workaddict.me/clockify-alternative/` without running JavaScript
- **THEN** the response is an HTML page whose `<h1>` and body text describe Workaddict as a free, open-source Clockify alternative with no server

#### Scenario: German page
- **WHEN** a visitor opens `https://workaddict.me/de/clockify-alternative/`
- **THEN** the page is in German, declares `lang="de"`, and its headline contains "Clockify-Alternative"

#### Scenario: No script runs
- **WHEN** any of the four pages is opened in the production build
- **THEN** the page loads no script files and contains no executable inline script

### Requirement: Page head and language pairing
Each page SHALL contain a `<title>` that includes "Workaddict" and the page topic, a meta description of at most 160 characters, a canonical link to its own absolute URL with a trailing slash, Open Graph and Twitter card tags whose URL equals the canonical and whose image is `https://workaddict.me/og-image.png`, and `hreflang` alternate links for `en`, `de` and `x-default` (pointing to the English page) that connect each English page to its German counterpart. Each page SHALL show a visible link to its counterpart in the other language.

#### Scenario: Canonical and preview
- **WHEN** `https://workaddict.me/import-from-clockify/` is requested
- **THEN** it declares `<link rel="canonical" href="https://workaddict.me/import-from-clockify/">` and `og:url` with the same URL

#### Scenario: Hreflang pair
- **WHEN** the English Clockify alternative page is parsed
- **THEN** it has `hreflang="en"` pointing to itself, `hreflang="de"` pointing to `https://workaddict.me/de/clockify-alternative/`, and `hreflang="x-default"` pointing to the English page, and the German page declares the same three links

#### Scenario: Switch language
- **WHEN** a visitor clicks the language link on the German import guide
- **THEN** the English import guide opens

### Requirement: Clockify alternative content
The Clockify alternative pages SHALL explain why teams switch (the data stays as plain files in the team's own private GitHub repository with full history, the code is open source, there is no server to host, and there is no account with another vendor besides GitHub). They SHALL show a feature table that compares Workaddict with Clockify's free plan, includes at least one row where Clockify offers something Workaddict does not, and states the date the facts were checked. They SHALL state Workaddict's limits (a GitHub account and token are required, and it is built for small teams). They SHALL link to the import guide in the same language and to the app's demo. The pages SHALL NOT claim that Clockify is expensive, SHALL NOT claim GDPR compliance or EU hosting, and SHALL NOT state figures that cannot be verified on public pages.

#### Scenario: Honest comparison
- **WHEN** a visitor reads the feature table
- **THEN** it contains at least one row where Clockify is marked as ahead, and a note with the month and year the facts were checked

#### Scenario: Path to switching
- **WHEN** a visitor finishes reading the English Clockify alternative page
- **THEN** the page offers a link to `/import-from-clockify/` and a link to the app

### Requirement: Clockify import guide content
The import guides SHALL describe the prerequisites (a Workaddict workspace in which the user is a team leader, and a Clockify API key created under Profile settings → API, from a workspace admin for a full-team import), and the steps of the built-in import in the order the app shows them: open Settings → Data → Import from Clockify, enter the key and region, choose the workspace, map Clockify users to members or former members, load the entries, check the preview, and import. They SHALL note that the Clockify Free plan limits requests and that the import pauses and resumes, that the import replaces existing entries, projects and tags only after confirmation, that the key is sent only to Clockify and never saved, and that a wrong mapping can be fixed later under Settings → Data → Reassign entries. UI labels quoted in the guides SHALL match the app's labels in the same language. The guides SHALL include screenshots of the import made with demo or test data only, each with alt text and explicit width and height.

#### Scenario: Labels match the app
- **WHEN** the English guide quotes the settings action and the key field
- **THEN** it uses the exact English app labels "Import from Clockify" and "Clockify API key", and the German guide uses the exact German app labels

#### Scenario: Screenshots
- **WHEN** a visitor views the import guide
- **THEN** screenshots of the import wizard are shown, each with alt text, and none shows real personal data

### Requirement: Shared layout and quality
All four pages SHALL share the same header (brand linking to the app, language link, "Open app" link) and the same footer (links to the other search page in the same language, the app, the source code, issues, the security policy, the author credit, and the license). Links between the pages and to the app SHALL be relative, so the site also works under a fork's GitHub Pages path. The pages SHALL use the app's design tokens, SHALL follow the system light or dark preference, SHALL NOT scroll horizontally at 360 px width (wide tables scroll inside their own container), and SHALL load nothing from other origins. The pages SHALL get the same Content Security Policy as the app from the build and SHALL contain no `style` attribute, no `<style>` element, and no inline script other than JSON-LD data blocks.

#### Scenario: Dark system preference
- **WHEN** a visitor with a dark system theme opens any of the pages
- **THEN** the page renders with the app's dark colors

#### Scenario: Phone width
- **WHEN** any page is shown at 360 px width
- **THEN** the page does not scroll horizontally, and the feature table scrolls within its own area

#### Scenario: Same policy as the app
- **WHEN** the production build is created
- **THEN** each page's HTML contains the same Content Security Policy meta tag as `index.html`, and opening the page logs no CSP violations

#### Scenario: Layout drift
- **WHEN** one page's header or footer is missing a link that the other pages have
- **THEN** the test suite fails

