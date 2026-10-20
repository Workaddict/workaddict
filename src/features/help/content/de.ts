import type { HelpContent } from './types'

const de: HelpContent = {
  tracking: {
    summary:
      'Starte einen Timer, während du arbeitest, oder trage eine Zeit nachträglich ein. Jeder Eintrag kann ein Projekt, Labels und einen Issue-Link haben.',
    sections: [
      {
        heading: 'Timer',
        blocks: [
          'Gib ein, woran du arbeitest, wähle bei Bedarf Projekt und Labels und klicke auf Starten. Der Timer läuft weiter, wenn du die Seite schließt, und erscheint auf jedem Gerät, auf dem du angemeldet bist.',
          'Mit Stoppen wird die Zeit als Eintrag gespeichert. Solange ein Timer läuft, zeigt die Kopfzeile auf jeder Seite die Zeit und einen Stopp-Button.',
        ],
      },
      {
        heading: 'Manuelle Einträge',
        blocks: [
          'Schalte die Timer-Leiste auf „Manuell“, um eine Zeit nachträglich einzutragen: Datum, Beginn und Ende oder Beginn und Dauer. Ein Eintrag darf über Mitternacht gehen.',
          {
            note: 'Bearbeiter und die Teamleitung können auch für ein anderes Mitglied eintragen.',
          },
        ],
      },
      {
        heading: 'Einträge ändern',
        blocks: [
          'Klicke in der Liste auf Beschreibung, Projekt, Labels oder Zeiten eines Eintrags, um sie direkt dort zu ändern. Enter speichert, Esc verwirft.',
          'Mit „Ich“ und „Alle“ über der Liste wechselst du zwischen deinen Einträgen und denen des ganzen Teams.',
        ],
      },
      {
        heading: 'Timer stoppen, wenn ich die Seite schließe',
        blocks: [
          'In den Einstellungen legst du fest, ob die App beim nächsten Öffnen fragt, den Timer zu dem Zeitpunkt zu stoppen, als du gegangen bist. Bis dahin zeigen andere Geräte ihn weiter als laufend.',
        ],
      },
    ],
    related: ['work-groups', 'issue-links', 'time-zone'],
    keywords: [
      'timer',
      'starten',
      'stoppen',
      'manuell',
      'eintrag',
      'bearbeiten',
      'dauer',
      'über nacht',
      'zeiterfassung',
    ],
  },
  token: {
    summary:
      'Workaddict hat keinen Server. Deine Daten liegen in einem privaten GitHub-Repository, und ein Token erlaubt der App, es aus deinem Browser zu lesen und zu schreiben.',
    sections: [
      {
        heading: 'Das Daten-Repository',
        blocks: [
          'Alle Einträge, Projekte, Labels und laufenden Timer sind JSON-Dateien in einem privaten Repository, das du verwaltest, zum Beispiel my-team/time-data.',
          'Jede Änderung ist ein Commit mit lesbarer Nachricht. So ist das Repository auch ein Verlauf, den du ansehen und rückgängig machen kannst.',
          'Jedes Mitglied schreibt nur die eigenen Eintrags- und Timer-Dateien, damit sich niemand gegenseitig überschreibt.',
        ],
      },
      {
        heading: 'Das Token',
        blocks: [
          'Ein Personal Access Token ist wie ein Passwort für einen bestimmten Zweck. Du erstellst es auf GitHub, und die App sendet es nur an api.github.com.',
          'Verwende ein Fine-grained Token, das nur auf das Daten-Repository zugreift, mit der Berechtigung „Contents: Read and write“. Dann kann das Token sonst nichts anfassen.',
          {
            note: 'Behandle das Token wie ein Passwort: nicht weitergeben und nicht auf fremden Computern einfügen.',
          },
        ],
      },
      {
        heading: 'Zum ersten Mal einrichten',
        blocks: [
          'Hat dein Team noch kein Daten-Repository, führt dich der Einrichtungsassistent Schritt für Schritt durch: Organisation, Repository, Einladungen und Token.',
          { link: '/setup', label: 'Einrichtung starten' },
        ],
      },
    ],
    related: ['workspaces', 'roles'],
    keywords: [
      'github',
      'pat',
      'personal access token',
      'repository',
      'anmelden',
      'login',
      'fine-grained',
      'klassisch',
      'einrichten',
      'repo',
    ],
  },
  workspaces: {
    summary:
      'Ein Arbeitsbereich ist ein Daten-Repository, das mit seinem Token auf diesem Gerät gespeichert ist. Mit mehreren Arbeitsbereichen wechselst du mit einem Klick zwischen Teams.',
    sections: [
      {
        heading: 'Arbeitsbereich speichern',
        blocks: [
          'Wenn du dich mit „Als Arbeitsbereich auf diesem Gerät speichern“ anmeldest, wird das Token in diesem Browser gespeichert, verschlüsselt mit deiner Passphrase.',
          'Ohne diese Option bist du nur in diesem Tab angemeldet und gibst das Token beim nächsten Mal erneut ein.',
        ],
      },
      {
        heading: 'Die Passphrase',
        blocks: [
          'Die Passphrase verschlüsselt alle gespeicherten Tokens auf diesem Gerät. Sie wird nirgendwohin gesendet.',
          {
            note: 'Die Passphrase lässt sich nicht wiederherstellen. Wenn du sie vergisst, setzt du die Arbeitsbereiche auf diesem Gerät zurück und gibst deine Tokens erneut ein. Auf GitHub ändert sich nichts.',
          },
          '„Bei jedem Besuch nach der Passphrase fragen“ ist am sichersten. „Auf diesem Gerät entsperrt bleiben“ ist bequem auf dem eigenen Computer.',
          '„Sperren“ im Avatar-Menü entfernt den Schlüssel aus allen offenen Tabs.',
        ],
      },
      {
        heading: 'Wechseln und hinzufügen',
        blocks: [
          'Der Name des geöffneten Arbeitsbereichs steht in der oberen Leiste. Klicke darauf, um zu wechseln, oder wähle „Arbeitsbereich hinzufügen“.',
          'Jeder Tab hat seinen eigenen Arbeitsbereich, so können zwei Tabs zwei Teams zeigen.',
        ],
      },
      {
        heading: 'Auf ein anderes Gerät umziehen',
        blocks: [
          'Einstellungen → Arbeitsbereiche → „Arbeitsbereiche exportieren“ lädt eine verschlüsselte Datei herunter. Importiere sie auf dem anderen Gerät mit derselben Passphrase.',
        ],
      },
    ],
    related: ['token'],
    keywords: [
      'profil',
      'tresor',
      'passwort',
      'entsperren',
      'sperren',
      'wechseln',
      'exportieren',
      'importieren',
      'vergessen',
      'arbeitsbereich',
    ],
  },
  roles: {
    summary:
      'Jedes Mitglied hat eine Rolle: Mitarbeiter, Bearbeiter oder Teamleitung. Owner des Daten-Repositorys haben immer die Rolle Teamleitung.',
    sections: [
      {
        heading: 'Was jede Rolle darf',
        blocks: [
          {
            list: [
              'Mitarbeiter: erfasst die eigene Zeit und nutzt vorhandene Projekte und Labels.',
              'Bearbeiter: legt außerdem Projekte und Labels an und ändert sie, sieht „Team jetzt“ und bearbeitet, ergänzt und stoppt Zeiten anderer Mitglieder.',
              'Teamleitung: vergibt außerdem Rollen, legt die Team-Zeitzone fest, importiert aus Clockify und verschiebt oder ordnet Einträge neu zu.',
            ],
          },
          'Ein Mitglied ohne zugewiesene Rolle ist Mitarbeiter.',
        ],
      },
      {
        heading: 'Rollen vergeben',
        blocks: [
          'Owner vergeben Rollen unter Einstellungen → Team & Rollen. Jede Änderung wird als Commit gespeichert, der nennt, wer was geändert hat.',
        ],
      },
      {
        heading: 'Gut zu wissen',
        blocks: [
          {
            note: 'Rollen setzt nur die App durch. Wer Schreibzugriff auf das Repository hat, kann Dateien direkt auf GitHub ändern, aber jede Änderung bleibt im Commit-Verlauf sichtbar.',
          },
        ],
      },
    ],
    related: ['team-now', 'work-groups'],
    keywords: [
      'berechtigung',
      'rechte',
      'owner',
      'admin',
      'teamleitung',
      'bearbeiter',
      'mitarbeiter',
      'team',
    ],
  },
  'work-groups': {
    summary:
      'Projekte sagen, woran du arbeitest, Labels ergänzen Stichworte. Bearbeiter und die Teamleitung verwalten sie auf der Seite Projekte & Labels.',
    sections: [
      {
        heading: 'Projekte',
        blocks: [
          'Jeder Eintrag hat höchstens ein Projekt. Ein Projekt hat einen eindeutigen Namen und eine Farbe.',
          'Archiviere ein Projekt, das du nicht mehr nutzt: Alte Einträge behalten es, für neue wird es nicht mehr angeboten.',
          'Ein Projekt kann mit GitHub-Repositories und einem Project-Board verknüpft werden, damit Issue-Links kurz einzugeben sind.',
        ],
      },
      {
        heading: 'Labels',
        blocks: [
          'Ein Eintrag kann beliebig viele Labels haben, zum Beispiel „Meeting“ oder „Bugfix“. Die Statistik kann nach Label gruppieren.',
        ],
      },
      {
        heading: 'Löschen',
        blocks: [
          'Vor dem Löschen zeigt die App, wie viele Einträge das Projekt oder Label nutzen. Die Einträge bleiben erhalten, nur ohne den Verweis.',
        ],
      },
    ],
    related: ['issue-links', 'roles'],
    keywords: ['projekt', 'label', 'farbe', 'archivieren', 'kategorie', 'tag'],
  },
  'team-now': {
    summary:
      '„Team jetzt“ zeigt Bearbeitern und der Teamleitung, wer gerade erfasst und wie viel alle heute erfasst haben.',
    sections: [
      {
        heading: 'Was du siehst',
        blocks: [
          'Mitglieder mit laufendem Timer stehen oben, mit Beschreibung, Projekt, Labels und Laufzeit. Darunter die anderen mit ihrer Summe für heute und dem Ende ihres letzten Eintrags.',
          'Ein Timer, der länger als 10 Stunden oder seit vor Mitternacht läuft, wird als zu lang laufend markiert.',
        ],
      },
      {
        heading: 'Timer stoppen oder verwerfen',
        blocks: [
          'Stoppen speichert den Timer als Eintrag mit einer Endzeit, die du wählst. Verwerfen entfernt ihn ohne Eintrag. Das Mitglied erfährt, wer seinen Timer gestoppt hat.',
        ],
      },
      {
        heading: 'Block ausblenden',
        blocks: ['Du kannst „Team jetzt“ ausblenden; die Wahl wird in diesem Browser gespeichert.'],
      },
      {
        heading: 'Gut zu wissen',
        blocks: [
          {
            note: 'Nur die App blendet „Team jetzt“ für Mitarbeiter aus. Jedes Mitglied kann laufende Timer im Daten-Repository auf GitHub lesen.',
          },
        ],
      },
    ],
    related: ['roles', 'tracking'],
    keywords: ['live', 'läuft', 'wer', 'heute', 'stoppen', 'verwerfen', 'zu lange'],
  },
  'issue-links': {
    summary:
      'Verbinde einen Eintrag mit dem GitHub-Issue oder Pull Request, zu dem er gehört. Statistik und Exporte zeigen den Link.',
    sections: [
      {
        heading: 'Was du einfügen kannst',
        blocks: [
          {
            list: [
              'owner/repo#42',
              'Den Link eines Issues oder Pull Requests auf GitHub',
              'Den Link einer Karte auf einem GitHub-Projects-Board',
              '#42 oder 42, wenn das Projekt des Eintrags mit einem Repository verknüpft ist',
            ],
          },
          'Die App zeigt den Link als owner/repo#42 und öffnet ihn auf GitHub. Sie liest deine Issues nie über die API.',
        ],
      },
      {
        heading: 'Kurzform #42',
        blocks: [
          'Für #42 nutzt die App das erste verknüpfte Repository des Projekts. Ohne eines nutzt sie das Repository des letzten Issue-Links im Projekt.',
          'Mit name#42 wählst du ein anderes verknüpftes Repository über seinen Namen.',
        ],
      },
      {
        heading: 'Project-Boards',
        blocks: [
          'Ein Projekt kann ein GitHub-Projects-Board verknüpfen. Öffne eine Karte auf dem Board, kopiere die Adresse und füge sie ins Issue-Feld ein.',
        ],
      },
    ],
    related: ['work-groups', 'export'],
    keywords: [
      'issue',
      'pull request',
      'pr',
      'board',
      'karte',
      'github projects',
      'link',
      'repository',
    ],
  },
  'connect-ai': {
    summary:
      'Dein eigener KI-Assistent, etwa Claude Code, kann Projekte anlegen und Einträge für deinen Tag vorschlagen. Beta.',
    sections: [
      {
        heading: 'So funktioniert es',
        blocks: [
          'Der Assistent startet den Workaddict-MCP-Server auf deinem Rechner mit einem eigenen Token. Workaddict hat keinen Server und sieht keinen KI-Schlüssel.',
          'Vorgeschlagene Einträge werden erst gespeichert, wenn du sie bestätigst.',
        ],
      },
      {
        heading: 'Einrichten',
        blocks: [
          'Auf der Seite „KI verbinden“ stehen die Befehle für Claude Code und die Konfiguration für andere Assistenten zum Kopieren.',
          { link: '/connect-ai', label: 'KI verbinden öffnen' },
        ],
      },
      {
        heading: 'Datenschutz',
        blocks: [
          'Claude-Code-Verläufe werden nur auf deinem Rechner gelesen. Gespeichert wird nur die Beschreibung, die du bestätigst, und das ganze Team kann sie sehen.',
          'Der Assistent kann Daten lesen und hinzufügen, aber nichts löschen und keine Rollen ändern.',
        ],
      },
    ],
    related: ['token', 'tracking'],
    keywords: ['ki', 'ai', 'claude', 'mcp', 'assistent', 'cursor', 'plugin', 'automatisch'],
  },
  export: {
    summary: 'Lade die Statistik als Bericht oder Tabelle herunter, oder alle Daten als Sicherung.',
    sections: [
      {
        heading: 'Berichte und Tabellen',
        blocks: [
          'Wähle auf der Statistikseite Zeitraum und Filter und öffne dann „Exportieren“:',
          {
            list: [
              'PDF-Bericht mit Summen, Diagrammen und Eintragsliste',
              'Excel (.xlsx) und OpenDocument (.ods) mit Tabellenblättern für Übersicht, Einträge, Projekte und Mitglieder',
              'CSV mit einer Zeile pro Eintrag',
            ],
          },
          'Exporte enthalten nur, was die aktuellen Filter zeigen.',
        ],
      },
      {
        heading: 'Sicherung',
        blocks: [
          'Einstellungen → Daten → „Sicherung herunterladen“ speichert alle Einträge aller Mitglieder, Projekte und Labels als eine JSON-Datei.',
          'Deine Daten sind außerdem im Daten-Repository und seinem Commit-Verlauf sicher.',
        ],
      },
    ],
    related: ['issue-links', 'clockify-import'],
    keywords: [
      'pdf',
      'excel',
      'xlsx',
      'ods',
      'csv',
      'herunterladen',
      'bericht',
      'sicherung',
      'backup',
      'json',
    ],
  },
  'clockify-import': {
    summary:
      'Die Teamleitung kann Projekte, Labels und Zeiteinträge in einem Schritt aus Clockify übernehmen.',
    sections: [
      {
        heading: 'Bevor du startest',
        blocks: [
          'Du brauchst einen Clockify-API-Schlüssel: Kontomenü (oben rechts) → Preferences → Advanced → Manage API keys → Generate. Der Schlüssel geht nur an Clockify und wird nicht gespeichert.',
          {
            note: 'Der Import ersetzt vorhandene Einträge, Projekte und Labels im Daten-Repository. Die App warnt dich und zeigt, wie viel ersetzt wird.',
          },
        ],
      },
      {
        heading: 'Die Schritte',
        blocks: [
          {
            steps: [
              'Einstellungen → Daten → Clockify-Import starten.',
              'Den Clockify-Workspace wählen.',
              'Jeden Clockify-Benutzer einem GitHub-Login zuordnen, als ehemaliges Mitglied behalten oder überspringen.',
              'Die Vorschau prüfen und bestätigen. Alles wird in einem Commit geschrieben.',
            ],
          },
          'Clockify-Tags werden zu Labels. Kunden, Aufgaben, Abrechenbarkeit und Stundensätze werden nicht übernommen.',
          { link: 'seo:import-from-clockify', label: 'Ausführliche Anleitung: Umzug von Clockify' },
        ],
      },
      {
        heading: 'Danach',
        blocks: [
          'Jemanden falsch zugeordnet? Einstellungen → Daten → „Einträge neu zuordnen“ überträgt alle Einträge eines Mitglieds auf ein anderes.',
        ],
      },
    ],
    related: ['export', 'roles'],
    keywords: ['clockify', 'import', 'umziehen', 'wechseln', 'api-schlüssel', 'übernehmen'],
  },
  'time-zone': {
    summary:
      'Zeiten und Tage werden in einer wirksamen Zeitzone angezeigt, damit das ganze Team dieselben Tage sieht.',
    sections: [
      {
        heading: 'Welche Zone gilt',
        blocks: [
          {
            steps: [
              'Deine Geräte-Einstellung, falls du in den Einstellungen eine gewählt hast',
              'Sonst die Team-Zeitzone, festgelegt von der Teamleitung',
              'Sonst die Zone, die dein Browser meldet',
            ],
          },
          'Die Einstellungen zeigen die wirksame Zone und woher sie kommt.',
        ],
      },
      {
        heading: 'Browser meldet UTC?',
        blocks: [
          'Manche Browser verbergen die echte Zeitzone und melden UTC. Dann wirken Zeiten verschoben. Bitte deine Teamleitung, die Team-Zeitzone festzulegen.',
          'Wurden Zeiten in der falschen Zone gespeichert, kann die Teamleitung sie unter Einstellungen → Daten → „Zeiten verschieben“ korrigieren.',
        ],
      },
    ],
    related: ['tracking'],
    keywords: ['zone', 'utc', 'zeitzone', 'verschieben', 'stunden falsch', 'uhrzeit'],
  },
}

export default de
