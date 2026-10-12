## MODIFIED Requirements

### Requirement: Responsive clean design
The system SHALL be usable on screens from 320 px wide to desktop and SHALL NOT scroll horizontally at any width in that range, in every supported language and while a timer is running. Navigation labels SHALL stay on one line, and the header's running-timer elapsed time and stop button SHALL stay fully visible at every width. Controls SHALL be touch-friendly on mobile, form fields SHALL NOT cause the browser to zoom in when focused on phones, and fixed navigation SHALL clear the device's safe areas. Every form field, including native date and time fields, SHALL stay within its layout cell, SHALL have the same height and text alignment as text fields, and fields in the same row SHALL have their labels at the same height. On phones, rows of form actions SHALL wrap or stack instead of cutting off their content. The system SHALL support light and dark themes following the system setting with a manual override.

#### Scenario: Phone layout
- **WHEN** the app is opened on a 375 px wide screen
- **THEN** navigation collapses into a mobile layout and all pages are usable without horizontal scrolling

#### Scenario: Narrowest phone in German
- **WHEN** the start page and every app page are opened in German on a 320 px wide screen
- **THEN** no page scrolls horizontally and no button text extends outside its button

#### Scenario: Tablet width with a running timer
- **WHEN** a timer is running and the app is opened in German at any width between 721 px and 1100 px
- **THEN** the page does not scroll horizontally, the navigation labels are each on one line, and the header shows the full elapsed time and the stop button

#### Scenario: No zoom on focus
- **WHEN** a user on an iPhone taps a text field, date or time field, or select in the app or on the start page
- **THEN** the browser does not zoom the page in

#### Scenario: Bottom navigation on a phone with a home indicator
- **WHEN** the app is opened on a phone with a bottom safe-area inset
- **THEN** the bottom navigation's icons and labels sit fully above the inset

#### Scenario: Dark mode
- **WHEN** the operating system uses a dark color scheme and the user has not chosen a theme
- **THEN** the app renders in its dark theme

#### Scenario: Native date field on iPhone
- **WHEN** the manual entry form is opened in Safari on an iPhone at 375 px
- **THEN** the date field ends inside its own cell without overlapping the next field, has the same height as the time fields, and its value is left-aligned like other fields

#### Scenario: Manual entry form on a phone
- **WHEN** an editor opens the manual entry form on a 320 px or 375 px wide screen
- **THEN** the date field takes the full width on its own row, start and end (or duration) sit side by side on the row below with labels at the same height, and the member picker and the submit button each take the full width, one under the other, with the selected member's name fully readable or ellipsized inside the picker

#### Scenario: Manual entry form on desktop
- **WHEN** the manual entry form is opened at 1024 px or wider
- **THEN** date, start, and end sit in one row, and the member picker and submit button sit in one row aligned to the right

#### Scenario: Stop dialog on a phone
- **WHEN** a team leader opens the dialog to stop another member's timer on a 320 px wide screen
- **THEN** its date and time fields stay within the dialog and are laid out like the manual entry form
