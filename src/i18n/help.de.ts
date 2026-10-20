import type { Resources } from './en'

const help: Resources['help'] = {
  title: 'Hilfe',
  learnMore: 'Mehr erfahren',
  helpFor: 'Hilfe: {{topic}}',
  new: 'Neu',
  whatIs: {
    'data-repo': 'Was ist ein Daten-Repository?',
    token: 'Was ist ein Token?',
    workspace: 'Was ist ein Arbeitsbereich?',
  },
  topics: {
    tracking: 'Zeit erfassen',
    token: 'Token & Daten-Repository',
    workspaces: 'Arbeitsbereiche & Passphrase',
    roles: 'Rollen',
    'work-groups': 'Projekte & Labels',
    'team-now': 'Team jetzt',
    'issue-links': 'Issue-Links & Project-Boards',
    'connect-ai': 'KI-Assistent verbinden',
    export: 'Export & Sicherung',
    'clockify-import': 'Import aus Clockify',
    'time-zone': 'Zeitzone',
    shortcuts: 'Tastenkürzel',
    glossary: 'Glossar',
  },
  index: {
    intro: 'Kurze Erklärungen, wie Workaddict funktioniert. Wähle ein Thema oder suche.',
    notFound: 'Thema nicht gefunden. Hier sind alle Hilfethemen.',
    search: 'Hilfe durchsuchen',
    searchPlaceholder: 'z. B. Passphrase, Export, Rollen',
    noResults: 'Nichts gefunden. Versuche ein anderes Wort oder schau dir die Themen an.',
  },
  page: {
    back: 'Alle Hilfethemen',
    backToApp: 'Zurück zur App',
    related: 'Verwandte Themen',
    helpful: 'War das hilfreich?',
    yes: 'Ja',
    no: 'Nein',
    thanks: 'Danke für die Rückmeldung!',
    askIntro: 'Das tut uns leid. Stell deine Frage auf GitHub, dann verbessern wir diese Seite.',
    ask: 'Frage auf GitHub stellen',
    loading: 'Hilfe wird geladen…',
  },
  glossary: {
    intro: 'Die Begriffe, die Workaddict verwendet, in je einem Satz.',
    terms: {
      'data-repo': {
        term: 'Daten-Repository',
        short:
          'Ein privates GitHub-Repository, das alle Einträge, Projekte und Labels als Dateien enthält; Workaddict hat keinen eigenen Server.',
      },
      token: {
        term: 'Token',
        short:
          'Ein Schlüssel, den du auf GitHub erstellst und mit dem die App das Daten-Repository in deinem Namen liest und schreibt.',
      },
      workspace: {
        term: 'Arbeitsbereich',
        short:
          'Ein Daten-Repository, das mit seinem Token auf diesem Gerät gespeichert ist, damit du mit einem Klick wechseln kannst.',
      },
      passphrase: {
        term: 'Passphrase',
        short:
          'Das Passwort, das deine gespeicherten Tokens auf diesem Gerät verschlüsselt; es lässt sich nicht wiederherstellen.',
      },
      demo: {
        term: 'Demo',
        short:
          'Die App mit Beispieldaten ausprobieren, die nur im Speicher liegen und nie gespeichert werden.',
      },
      role: {
        term: 'Rolle',
        short: 'Legt fest, was ein Mitglied darf: Mitarbeiter, Bearbeiter oder Teamleitung.',
      },
      owner: {
        term: 'Owner',
        short:
          'Wer auf GitHub Admin-Rechte am Daten-Repository hat; Owner haben immer die Rolle Teamleitung.',
      },
      leader: {
        term: 'Teamleitung',
        short:
          'Darf alles: Projekte, Rollen, die Team-Zeitzone und die Einträge anderer Mitglieder verwalten.',
      },
      editor: {
        term: 'Bearbeiter',
        short:
          'Darf Projekte und Labels verwalten, „Team jetzt“ sehen und Zeiten anderer Mitglieder bearbeiten oder stoppen.',
      },
      worker: {
        term: 'Mitarbeiter',
        short: 'Erfasst die eigene Zeit und nutzt die vorhandenen Projekte und Labels.',
      },
      project: {
        term: 'Projekt',
        short: 'Woran du arbeitest; jeder Eintrag hat höchstens ein Projekt.',
      },
      tag: {
        term: 'Label',
        short: 'Ein Stichwort wie „Meeting“ oder „Bugfix“; ein Eintrag kann mehrere Labels haben.',
      },
      'team-now': {
        term: 'Team jetzt',
        short:
          'Zeigt Bearbeitern und der Teamleitung, wer gerade erfasst und wie viel alle heute erfasst haben.',
      },
      'issue-link': {
        term: 'Issue-Link',
        short:
          'Verbindet einen Eintrag mit einem GitHub-Issue oder Pull Request, z. B. owner/repo#42.',
      },
      'project-board': {
        term: 'Project-Board',
        short:
          'Ein GitHub-Projects-Board, das mit einem Projekt verknüpft ist; ein eingefügter Karten-Link füllt das Issue aus.',
      },
      mcp: {
        term: 'MCP',
        short:
          'Das Model Context Protocol: So spricht ein KI-Assistent wie Claude Code mit Workaddict.',
      },
      backup: {
        term: 'Sicherung',
        short:
          'Eine JSON-Datei mit allen Daten des Arbeitsbereichs, zum Aufbewahren oder Umziehen.',
      },
      'time-zone': {
        term: 'Zeitzone',
        short:
          'Die Zone, in der Zeiten und Tage angezeigt werden: die deines Geräts, die des Teams oder eine gewählte.',
      },
    },
  },
  shortcuts: {
    help: 'Hilfe öffnen',
    close: 'Dialog, Menü, Hinweis oder Tour schließen',
    save: 'Bearbeitetes Feld speichern',
    cancel: 'Änderung eines bearbeiteten Felds verwerfen',
    move: 'Zwischen Bedienelementen wechseln',
  },
  overlay: {
    shortcuts: 'Tastenkürzel',
    allTopics: 'Alle Hilfethemen',
    restartTour: 'Tour neu starten',
    topic: 'Thema',
    term: 'Begriff',
  },
  tour: {
    stepOf: 'Schritt {{n}} von {{total}}',
    back: 'Zurück',
    next: 'Weiter',
    done: 'Fertig',
    end: 'Tour beenden',
    label: 'Geführte Tour',
    steps: {
      timer: {
        title: 'Zeit erfassen',
        body: 'Gib ein, woran du arbeitest, und klicke auf Starten. Mit „Manuell“ trägst du eine Zeit nachträglich ein.',
      },
      entries: {
        title: 'Deine Einträge',
        body: 'Erfasste Zeiten erscheinen hier, nach Tagen gruppiert. Klicke auf Beschreibung, Projekt oder Zeit, um sie zu ändern.',
      },
      filter: {
        title: 'Ich oder alle',
        body: 'Wechsle zwischen deinen eigenen Einträgen und denen des ganzen Teams.',
      },
      teamNow: {
        title: 'Team jetzt',
        body: 'Sieh, wer gerade erfasst und wie viel alle heute erfasst haben. Einen zu lange laufenden Timer kannst du stoppen.',
      },
      workGroups: {
        title: 'Projekte & Labels',
        body: 'Projekte und Labels ordnen deine Einträge. Hier werden sie angelegt, eingefärbt und archiviert.',
      },
      stats: {
        title: 'Statistik',
        body: 'Wähle Zeitraum und Filter, um zu sehen, wohin die Zeit ging: nach Projekt, Label und Mitglied.',
      },
      export: {
        title: 'Export',
        body: 'Lade die gefilterte Statistik als PDF, Excel, OpenDocument oder CSV herunter.',
      },
      workspace: {
        title: 'Dein Arbeitsbereich',
        body: 'Das ist der geöffnete Arbeitsbereich. Klicke darauf, um zu wechseln oder einen hinzuzufügen.',
      },
      menu: {
        title: 'Dein Menü',
        body: 'Hier findest du Einstellungen, Hilfe, die Startseite und Sperren oder Abmelden.',
      },
      roles: {
        title: 'Team & Rollen',
        body: 'Lege fest, wer Mitarbeiter, Bearbeiter oder Teamleitung ist.',
      },
      help: {
        title: 'Hilfe gibt es immer',
        body: 'Drücke überall ?, um die Hilfe zu öffnen. In diesem Abschnitt startest du die Tour neu oder schaltest den Expertenmodus ein.',
      },
    },
  },
  welcome: {
    title: 'Willkommen bei Workaddict',
    intro:
      'Möchtest du eine kurze Tour? Sie dauert etwa eine Minute und zeigt, wo alles ist. An deinen Daten wird nichts geändert.',
    demoIntro: 'Möchtest du eine kurze Tour durch die Demo? Sie dauert etwa eine Minute.',
    start: 'Tour starten',
    later: 'Später',
    no: 'Nein danke',
    expert: 'Ich kenne mich aus',
    expertHint:
      'Schaltet den Expertenmodus ein: weniger Hinweise. Du kannst das in den Einstellungen ändern.',
    existingNotice:
      'Neu: Hilfeseiten und eine geführte Tour. Du findest sie unter Einstellungen → Hilfe & Tour.',
  },
  checklist: {
    title: 'Erste Schritte',
    progress: '{{done}} von {{total}} erledigt',
    dismiss: 'Erste Schritte ausblenden',
    track: 'Erste Zeit erfassen',
    project: 'Projekt anlegen',
    tag: 'Label anlegen',
    team: 'Team einladen',
    ai: 'KI-Assistent verbinden (optional)',
    projectWorker:
      'Projekte und Labels legen Bearbeiter und die Teamleitung an. So funktioniert es',
    open: 'Öffnen',
  },
  settings: {
    title: 'Hilfe & Tour',
    expert: 'Expertenmodus',
    expertHint:
      'Zeigt weniger Hinweise: keine unterstrichenen Begriffe, keine ersten Schritte, keine „Neu“-Markierungen und keinen Willkommensdialog. Hilfeseiten und „?“-Buttons bleiben.',
    restartTour: 'Tour neu starten',
    restartHint: 'Führt dich noch einmal Seite für Seite durch die App.',
    showTips: 'Hinweise wieder anzeigen',
    showTipsHint: 'Zeigt die ersten Schritte und den Willkommensdialog wieder an.',
    tipsShown: 'Hinweise werden wieder angezeigt.',
    center: 'Hilfe öffnen',
    centerHint: 'Alle Hilfethemen, das Glossar und die Tastenkürzel. Tipp: Drücke überall ?.',
  },
  demoTour: 'Demo mit Tour',
  shots: {
    'org-new':
      'GitHubs Formular „Set up your organization“ mit den Feldern „Organization name“ und „Contact email“.',
    'repo-new':
      'GitHubs Formular „Create a new repository“: bei „Owner“ die Organisation, das Feld „Repository name“ und „Private“ unter „Choose visibility“.',
    'base-permission':
      'Die Seite „Member privileges“ der Organisation mit „Base permissions“ auf „No permission“.',
    'token-policy':
      'Die Einstellungen „Personal access tokens“ der Organisation: „Allow access via fine-grained personal access tokens“ und „Require administrator approval“ ausgewählt.',
    'org-invite': 'Die Seite „People“ der Organisation mit dem grünen Button „Invite member“.',
    'repo-access':
      'Der Bereich „Manage access“ des Repositorys mit dem Button „Add people“, über den du Mitglieder mit der Rolle „Write“ hinzufügst.',
    'token-form':
      'GitHubs Formular für Fine-grained Tokens: bei „Resource owner“ die Organisation und „Only select repositories“ mit einem ausgewählten Repository.',
    'token-permissions':
      'Der Berechtigungsteil des Token-Formulars: „Contents“ auf „Access: Read and write“ und der Button „Generate token“.',
    invitation: 'GitHubs Einladungsseite mit dem grünen Button „Join“.',
  },
}

export default help
