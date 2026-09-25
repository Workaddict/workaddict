## ADDED Requirements

### Requirement: Consistent German terminology
The German interface SHALL use one term per concept on every page and in every dialog, and the German static guides SHALL use "Label" where they describe Workaddict's own features:
- "Label"/"Labels" for tags ("Tag" SHALL NOT be used for tags, because it reads as a calendar day). An exception is text that names Clockify's own tag feature, which SHALL say that Clockify tags become labels.
- "Owner" for repository admins and GitHub organization owners ("Besitzer" SHALL NOT be used).
- "Teamleitung" for the team leader role.
- "Benutzer" for accounts ("Nutzer" SHALL NOT be used).

Questions SHALL use German word order. Button labels SHALL use the infinitive form ("Starten", "Stoppen").

#### Scenario: Statistics grouped by label
- **WHEN** a user with German selected opens the statistics page
- **THEN** the grouping reads "Nach Label", and no heading or column uses "Tag" for tags

#### Scenario: Owner role in settings
- **WHEN** an owner with German selected opens the team and roles section
- **THEN** their role is shown as "Owner", matching the help texts that refer to GitHub owners

#### Scenario: Timer buttons
- **WHEN** a user with German selected views the timer
- **THEN** the buttons read "Starten" and "Stoppen"
