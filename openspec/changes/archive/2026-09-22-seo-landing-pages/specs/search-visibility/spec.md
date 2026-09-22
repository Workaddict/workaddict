## MODIFIED Requirements

### Requirement: Crawl directives
The site SHALL serve a `robots.txt` at its root that allows all crawlers and references the sitemap, and a `sitemap.xml` at its root that lists every public page: `https://workaddict.me/` and each static search page (`/clockify-alternative/`, `/de/clockify-alternative/`, `/import-from-clockify/`, `/de/import-from-clockify/`). The sitemap SHALL list exactly the canonical URLs of the served pages.

#### Scenario: robots.txt
- **WHEN** `https://workaddict.me/robots.txt` is requested
- **THEN** the response allows all user agents and contains `Sitemap: https://workaddict.me/sitemap.xml`

#### Scenario: sitemap.xml
- **WHEN** `https://workaddict.me/sitemap.xml` is requested
- **THEN** the response is a valid XML sitemap listing `https://workaddict.me/` and the four search pages

#### Scenario: Page missing from sitemap
- **WHEN** a page's canonical URL is not listed in `sitemap.xml`, or the sitemap lists a URL that no page declares as canonical
- **THEN** the test suite fails

### Requirement: Search setup keeps the security policy
The head tags, static content and new files SHALL NOT require any change to the Content Security Policy: no inline executable `<script>`, no inline `<style>` element or `style` attribute, and no resources from other origins loaded by the page. The only inline script elements allowed SHALL be structured-data blocks of type `application/ld+json` that contain valid JSON.

#### Scenario: No CSP violations
- **WHEN** the production build is opened in a browser and the start page renders
- **THEN** the console shows no CSP or Trusted Types violations and the page makes no requests to other origins

#### Scenario: Only data blocks inline
- **WHEN** `index.html` contains an inline `<script>` element
- **THEN** the test suite fails unless its type is `application/ld+json` and its content parses as JSON

## ADDED Requirements

### Requirement: Structured data
The served `index.html` and the two Clockify alternative pages SHALL contain a schema.org `SoftwareApplication` description in JSON-LD. It SHALL give the name "Workaddict", the application category, the operating system "Web", the URL `https://workaddict.me/`, and an offer with price 0. It SHALL NOT contain ratings, reviews or other claims that the site does not show.

#### Scenario: Structured data present
- **WHEN** a crawler parses `https://workaddict.me/`
- **THEN** it finds a JSON-LD `SoftwareApplication` named "Workaddict" with an offer priced 0

#### Scenario: No invented ratings
- **WHEN** the JSON-LD blocks are parsed
- **THEN** none contains `aggregateRating` or `review`
