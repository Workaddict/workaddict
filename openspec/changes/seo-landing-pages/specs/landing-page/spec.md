## MODIFIED Requirements

### Requirement: Benefit highlights
Below the intro and the sign-in form, the start page SHALL show six short benefit highlights, each with an icon, a title, and one sentence: no cost and no server, data in the user's own private repository with full history, team roles and the live team view, a timer that syncs across devices, statistics and exports (PDF, Excel, OpenDocument, CSV), and the Clockify import. The Clockify import highlight SHALL link to the Clockify import guide in the current UI language (`./import-from-clockify/` for English, `./de/import-from-clockify/` for German), opening in the same tab.

#### Scenario: Highlights visible
- **WHEN** a visitor scrolls below the intro and sign-in form
- **THEN** the page shows the six benefit highlights, including the Clockify import and the exports

#### Scenario: Import guide link
- **WHEN** a visitor with German selected clicks the guide link in the Clockify import highlight
- **THEN** the German import guide `de/import-from-clockify/` opens in the same tab

### Requirement: Start page footer
The start page SHALL end with a footer that contains a link to the source code on GitHub (`https://github.com/Workaddict/workaddict`), a "Made by Benedikt Lehner" credit whose name links to `https://github.com/BenediktLehner`, a link to report an issue, a link to the security policy, and links to the Clockify alternative page and the Clockify import guide in the current UI language. External links SHALL open in a new tab without sending a referrer. The links to the site's own pages SHALL be relative and open in the same tab.

#### Scenario: Footer links
- **WHEN** a visitor scrolls to the bottom of the start page
- **THEN** the footer shows "Made by Benedikt Lehner" with the name linking to the author's GitHub profile, and links to the source code, its issues, and its security policy, each opening in a new tab

#### Scenario: Search page links in footer
- **WHEN** a visitor with English selected clicks "Clockify alternative" in the footer
- **THEN** `clockify-alternative/` opens in the same tab
