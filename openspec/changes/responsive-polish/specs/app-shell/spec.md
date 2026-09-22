## MODIFIED Requirements

### Requirement: Responsive clean design
The system SHALL be usable on screens from 320 px wide to desktop and SHALL NOT scroll horizontally at any width in that range, in every supported language and while a timer is running. Navigation labels SHALL stay on one line, and the header's running-timer elapsed time and stop button SHALL stay fully visible at every width. Controls SHALL be touch-friendly on mobile, form fields SHALL NOT cause the browser to zoom in when focused on phones, and fixed navigation SHALL clear the device's safe areas. The system SHALL support light and dark themes following the system setting with a manual override.

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
