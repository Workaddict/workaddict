import type { Resources } from './en'

const de: Resources = {
  common: {
    appName: 'Workaddict',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    edit: 'Bearbeiten',
    add: 'Hinzufügen',
    close: 'Schließen',
    loading: 'Wird geladen…',
    retry: 'Erneut versuchen',
    reload: 'Seite neu laden',
    pageLoadError: 'Diese Seite konnte nicht geladen werden.',
    pageLoadErrorHint:
      'Wahrscheinlich wurde eine neue Version der App veröffentlicht. Lade die Seite neu, um weiterzumachen.',
    noDescription: '(keine Beschreibung)',
    noProject: 'Kein Projekt',
    noTag: 'Kein Tag',
    archived: 'archiviert',
    search: 'Suchen…',
    create: '„{{name}}“ erstellen',
    all: 'Alle',
    selectedCount: '{{count}} ausgewählt',
    none: 'Keine',
    language: 'Sprache',
    switchToDark: 'Zum dunklen Design wechseln',
    switchToLight: 'Zum hellen Design wechseln',
    copied: 'Kopiert',
    copyManually:
      'Kopieren ist nicht verfügbar. Der Text ist markiert: drücke Strg+C (⌘C auf dem Mac).',
  },
  nav: {
    tracker: 'Zeiterfassung',
    stats: 'Statistik',
    workGroups: 'Projekte & Tags',
    settings: 'Einstellungen',
    logout: 'Abmelden',
  },
  login: {
    title: 'Anmelden',
    subtitle: 'Verbinde dein Daten-Repository mit einem GitHub-Token.',
    token: 'GitHub-Token',
    tokenPlaceholder: 'github_pat_…',
    repo: 'Daten-Repository',
    repoPlaceholder: 'besitzer/name',
    remember: 'Auf diesem Gerät angemeldet bleiben',
    rememberHint:
      'Speichert das Token und zwischengespeicherte Daten auf diesem Gerät. Nur auf dem eigenen Gerät verwenden, nicht auf gemeinsam genutzten Computern.',
    classicToken:
      'Das ist ein klassisches Token. Es hat meist Zugriff auf alle deine Repositories. Sicherer ist ein Fine-grained Token, das nur auf das Daten-Repository zugreifen kann.',
    classicTokenLink: 'Fine-grained Token erstellen',
    submit: 'Anmelden',
    checking: 'Wird geprüft…',
    demo: 'Demo ausprobieren (es wird nichts gespeichert)',
    or: 'oder',
    sessionExpired:
      'Deine Sitzung ist abgelaufen oder das Token wurde widerrufen. Bitte melde dich erneut an.',
    setupPrompt: 'Du richtest ein neues Team ein?',
    setupLink: 'Team Schritt für Schritt einrichten',
    errors: {
      badRepoFormat: 'Gib das Repository als besitzer/name an, z. B. mein-team/zeitdaten.',
      invalidToken:
        'GitHub hat dieses Token abgelehnt. Prüfe, ob es vollständig kopiert wurde und nicht abgelaufen ist.',
      repoNotFound: 'Auf das Repository {{repo}} kann mit diesem Token nicht zugegriffen werden.',
      ownerNotFound: 'Es gibt kein GitHub-Konto und keine Organisation mit dem Namen „{{owner}}“.',
      orgRepoNotAccessible: 'Dein Token sieht das Repository {{repo}} nicht.',
      ownRepoNotAccessible:
        'Dein Token sieht das Repository {{repo}} in deinem eigenen Konto nicht.',
      personalRepoNotAccessible:
        'Dein Token sieht das Repository {{repo}} nicht. Es gehört zum persönlichen Konto von {{owner}}.',
      noPushAccess: 'Du kannst das Repository {{repo}} lesen, aber nicht schreiben.',
      offline: 'GitHub ist nicht erreichbar. Prüfe deine Internetverbindung.',
      rateLimit: 'GitHub-Anfragelimit erreicht. Versuche es nach {{time}} erneut.',
      unknown: 'Bei der Verbindung mit GitHub ist etwas schiefgelaufen. Bitte versuche es erneut.',
    },
    help: {
      title: 'Wie bekomme ich ein Token?',
      intro:
        'Die App spricht direkt aus deinem Browser mit GitHub – mit einem persönlichen Zugriffstoken, das nur du kennst.',
      orderTitle: 'Bevor du anfängst',
      order:
        'Nimm die Einladung in die Organisation an und prüfe, ob du das Daten-Repository auf GitHub öffnen kannst. Ein Token, das vor dem Zugriff erstellt wurde, funktioniert nicht.',
      fineTitle: 'Empfohlen: Fine-grained Token',
      approval:
        'Organisationen verlangen standardmäßig, dass ein Owner neue Tokens freigibt. Bis dahin schlägt die Anmeldung fehl. Owner geben frei unter Organisation → Settings → Personal access tokens → Pending requests.',
      openGitHub: 'Token-Formular auf GitHub öffnen',
      classicTitle: 'Repository gehört dem persönlichen Konto einer anderen Person?',
      classicText:
        'Fine-grained Tokens funktionieren nur für Repositories, die dir oder einer Organisation gehören, in der du Mitglied bist. Verwende sonst ein klassisches Token mit dem Scope „repo“.',
      classicWarning:
        'Achtung: Ein klassisches „repo“-Token hat Zugriff auf alle deine Repositories. Besser: Daten-Repository in eine kostenlose GitHub-Organisation verschieben.',
      openClassic: 'Klassisches Token auf GitHub erstellen',
      security:
        'Dein Token wird nur in diesem Browser gespeichert und nur an api.github.com gesendet.',
    },
  },
  landing: {
    headline: 'Kostenlose Open-Source-Zeiterfassung',
    subline:
      'Eine einfache Zeiterfassung für dich und dein Team. Kein Abo, keine Werbung, kein Tracking.',
    factFree: 'Kostenlos. Keine Bezahlpläne, keine Limits.',
    factOpenSource: 'Open Source.',
    factOpenSourceLink: 'Code auf GitHub ansehen',
    factData: 'Deine Einträge bleiben in deinem eigenen privaten GitHub-Repository.',
    demo: 'Demo ausprobieren',
    highlightsTitle: 'Alles, was ein kleines Team braucht',
    highlights: {
      freeTitle: 'Kostenlos, ohne Server',
      freeText: 'Eine statische Website auf GitHub Pages. Kein Abo, keine Lizenzen pro Kopf.',
      repoTitle: 'Deine Daten, dein Repository',
      repoText:
        'Einträge liegen in einem privaten GitHub-Repository, das dir gehört. Jede Änderung ist ein Commit, den du rückgängig machen kannst.',
      teamTitle: 'Für Teams gemacht',
      teamText:
        'Rollen für Mitarbeiter, Bearbeiter und Teamleitung, dazu die Live-Ansicht „Team jetzt“, wer gerade Zeit erfasst.',
      timerTitle: 'Ein Timer, der mitkommt',
      timerText:
        'Am Laptop starten, am Handy stoppen. Einträge über Mitternacht funktionieren einfach.',
      reportsTitle: 'Auswertungen und Exporte',
      reportsText:
        'Diagramme nach Projekt, Tag und Mitglied. Export als PDF, Excel, OpenDocument oder CSV.',
      importTitle: 'Umstieg von Clockify',
      importText: 'Übernimm Projekte, Tags und Einträge mit dem eingebauten Import.',
      importGuide: 'Zur Import-Anleitung',
    },
    stepsTitle: 'So funktioniert’s',
    setupTeam: 'Team einrichten',
    step1Title: 'Privates Repository anlegen',
    step1Text: 'Ein leeres privates Repository auf GitHub speichert die Daten deines Teams.',
    step1Link: 'Einrichtungs-Anleitung öffnen',
    step2Title: 'Token erstellen',
    step2Text: 'Ein Fine-grained Token, das nur auf dieses Repository zugreifen kann.',
    step2Link: 'Zeig mir, wie',
    step3Title: 'Anmelden',
    step3Text: 'Repository und Token eingeben. Die App richtet beim ersten Mal alles ein.',
    inviteHint:
      'Du hast einen Einladungslink von deinem Team? Öffne ihn – er führt dich durch jeden Schritt.',
  },
  onboarding: {
    back: 'Zurück zur Startseite',
    onGitHub: 'Auf GitHub:',
    done: 'Erledigt',
    menu: {
      createOrg: 'Profilbild → Your organizations → New organization',
      newRepo: 'Organisationsseite → Repositories → New repository',
      memberPrivileges: 'Organisation → Settings → Member privileges → Base permissions',
      tokenPolicy: 'Organisation → Settings → Personal access tokens → Settings',
      pendingTokens: 'Organisation → Settings → Personal access tokens → Pending requests',
      people: 'Organisation → People → Invite member',
      orgInvitation: 'E-Mail von GitHub oder Organisationsseite → Join',
      repoInvitations: 'E-Mail von GitHub oder Repository-Seite → Accept invitation',
      repo: 'github.com/{{repo}}',
      repoAccess: 'Repository → Settings → Collaborators and teams',
      newToken:
        'Profilbild → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token',
      tokens:
        'Profilbild → Settings → Developer settings → Personal access tokens → Fine-grained tokens',
    },
    token: {
      sudo: 'GitHub fragt eventuell zuerst nach einer Bestätigung (Passwort oder GitHub Mobile).',
      intro:
        'GitHub füllt nur den Namen des Tokens aus. Die anderen vier Angaben musst du selbst setzen, in dieser Reihenfolge:',
      owner:
        'Resource owner: von deinem eigenen Benutzernamen auf {{owner}} umstellen. Das Formular öffnet immer mit deinem persönlichen Konto, und der Owner lässt sich später nicht ändern.',
      ownerGeneric:
        'Resource owner: von deinem eigenen Benutzernamen auf die Organisation umstellen, der das Daten-Repository gehört. Das Formular öffnet immer mit deinem persönlichen Konto, und der Owner lässt sich später nicht ändern.',
      expiry:
        'Expiration: 90 Tage oder länger. GitHub schlägt 30 Tage vor; danach meldest du dich mit einem neuen Token erneut an.',
      repo: 'Repository access: „Only select repositories“ → {{repo}}.',
      repoGeneric: 'Repository access: „Only select repositories“ → das Daten-Repository.',
      contents:
        'Permissions: Contents → Read and write. Das ist zu Beginn leer. Metadata (read-only) kommt automatisch dazu.',
      generate:
        'Auf „Generate token“ klicken und das Token kopieren (es beginnt mit github_pat_). GitHub zeigt es nur einmal.',
      open: 'Token-Formular öffnen',
    },
    diagnosis: {
      ownerNotFound:
        'Prüfe die Schreibweise. Am einfachsten: Repository auf GitHub öffnen und besitzer/name aus der Adresszeile kopieren.',
      likelyCauses: 'Wahrscheinlichste Ursachen, in dieser Reihenfolge:',
      approval:
        'Dein Token wartet auf Freigabe. Organisationen verlangen das standardmäßig. Ein Owner von {{org}} gibt es unter Pending requests frei.',
      approvalLink: 'Pending requests (für Owner)',
      invitation: 'Du hast die Einladung zu {{org}} noch nicht angenommen.',
      invitationLink: 'Einladung öffnen',
      repoOpen:
        'Du hast noch keinen Zugriff auf das Repository. Öffne es im Browser: Zeigt GitHub eine 404-Seite, muss ein Owner dir Zugriff geben.',
      repoOpenLink: '{{repo}} öffnen',
      resourceOwner:
        'Das Token hat den falschen Resource owner oder das Repository ist nicht ausgewählt. Resource owner muss {{org}} sein, und unter Repository access muss {{repo}} ausgewählt sein.',
      tokensLink: 'Deine Tokens',
      createdBefore:
        'Du hast das Token erstellt, bevor du Zugriff hattest. So ein Token sieht das Repository nie: lösche es und erstelle ein neues.',
      newTokenLink: 'Neues Token erstellen',
      repoName:
        'Der Repository-Name ist falsch geschrieben. Vergleiche ihn mit der Adresszeile auf GitHub.',
      classicScope: 'Ein klassisches Token braucht den Scope „repo“.',
      ownRepo:
        'Prüfe den Repository-Namen und ob das Token darauf zugreifen darf (Repository access → Only select repositories → {{repo}}).',
      personalFineGrained:
        'Fine-grained Tokens können nur auf Repositories deines eigenen Kontos oder von Organisationen zugreifen, in denen du Mitglied bist. Bitte {{owner}}, das Repository in eine kostenlose GitHub-Organisation zu verschieben, oder verwende ein klassisches Token mit dem Scope „repo“ (es hat Zugriff auf alle deine Repositories).',
      classicLink: 'Klassisches Token erstellen',
      personalInvite:
        'Nimm die Einladung zum Repository an. Gibt es keine, muss {{owner}} dich als Collaborator mit Write-Zugriff hinzufügen.',
      readOnlyToken:
        'Dein Token hat nur Contents: Read-only. Erstelle ein neues Token mit Contents: Read and write.',
      readOnlyRole: 'Oder deine Rolle im Repository ist Read. Ein Owner muss dir Write geben.',
      askOwner: 'Ein Owner muss etwas tun? Schick ihm diese Nachricht:',
      copyOwnerMessage: 'Nachricht an den Owner kopieren',
    },
    ownerMsg: {
      greeting: 'Hallo,',
      noAccess:
        'ich möchte mich bei unserer Zeiterfassung (Workaddict) anmelden, habe aber keinen Zugriff auf das Repository {{repo}}.',
      readOnly:
        'ich möchte mich bei unserer Zeiterfassung (Workaddict) anmelden, kann das Repository {{repo}} aber nur lesen, nicht schreiben.',
      login: 'Mein GitHub-Benutzername: {{login}}',
      pleaseCheck: 'Kannst du bitte Folgendes prüfen?',
      checkMember: 'Ich bin Mitglied der Organisation {{org}} (People: {{link}})',
      checkWrite: 'Ich habe Write-Zugriff auf {{repo}} (Collaborators and teams: {{link}})',
      checkApproval:
        'Mein Token ist freigegeben, falls die Organisation eine Freigabe verlangt (Pending requests: {{link}})',
      checkCollaborator: 'Ich bin Collaborator mit Write-Zugriff auf {{repo}} ({{link}})',
      thanks: 'Danke!',
    },
    inviteMsg: {
      intro:
        'Hallo! Wir erfassen unsere Zeiten mit Workaddict. Unsere Daten liegen im GitHub-Repository {{repo}}. So bist du dabei:',
      accept:
        'Nimm die Einladung in die GitHub-Organisation {{org}} an (E-Mail von GitHub oder hier: {{link}}).',
      open: 'Öffne dann diesen Link und folge den Schritten: {{link}}',
      approval: 'Sag mir Bescheid, wenn du dein Token erstellt hast, damit ich es freigeben kann.',
    },
    setup: {
      title: 'Team einrichten',
      intro:
        'Etwa 10 Minuten, einmalig. Jeder Schritt öffnet die passende GitHub-Seite. Hake ab, was erledigt ist; dein Fortschritt bleibt in diesem Browser gespeichert.',
      soloIntro:
        'Etwa 3 Minuten, einmalig. Jeder Schritt öffnet die passende GitHub-Seite. Hake ab, was erledigt ist; dein Fortschritt bleibt in diesem Browser gespeichert.',
      modeTitle: 'Für wen ist das?',
      modeSolo: 'Nur für mich',
      modeSoloHint: 'Ein privates Repository in deinem eigenen Konto. Drei Schritte.',
      modeTeam: 'Für ein Team',
      modeTeamHint: 'Eine GitHub-Organisation für alle. Etwa acht Schritte.',
      modeLater:
        'Unsicher? Fang mit „Nur für mich“ an. Du kannst später auf eine Organisation umsteigen; das Daten-Repository lässt sich übertragen.',
      modeChange: 'Ändern',
      org: 'Name der Organisation',
      orgHint: 'Deine neue oder bestehende GitHub-Organisation, z. B. mein-team.',
      orgInvalid: 'Nur Buchstaben, Ziffern und einzelne Bindestriche, höchstens 39 Zeichen.',
      user: 'Dein GitHub-Benutzername',
      userHint: 'Das Konto, zu dem das Repository gehören wird, z. B. mein-name.',
      userInvalid: 'Nur Buchstaben, Ziffern und einzelne Bindestriche, höchstens 39 Zeichen.',
      repo: 'Name des Repositorys',
      repoInvalid: 'Nur Buchstaben, Ziffern, Punkte, Binde- und Unterstriche.',
      needNames:
        'Gib zuerst einen gültigen Namen für die Organisation ein. Die Links unten verwenden ihn.',
      progress: '{{done}} von {{total}} erledigt',
      reset: 'Neu beginnen',
      orgTitle: 'Kostenlose Organisation anlegen',
      orgText:
        'Wähle den Free-Plan und nenne sie {{org}}. Mitglieder hinzufügen kannst du vorerst überspringen. Du hast schon eine Organisation? Dann einfach abhaken.',
      orgWhy:
        'Warum eine Organisation? Nur dann kann jedes Mitglied ein sicheres Token verwenden, das ausschließlich das Daten-Repository erreicht.',
      orgLink: 'Organisation anlegen',
      repoTitle: 'Privates Daten-Repository anlegen',
      repoText:
        'Das Formular ist vorausgefüllt: Owner {{org}}, Name {{repo}}, privat. README, .gitignore und Lizenz weglassen und auf „Create repository“ klicken.',
      repoLink: '{{org}}/{{repo}} anlegen',
      soloRepoText:
        'Das Formular ist vorausgefüllt: Owner {{org}}, Name {{repo}}, privat. README, .gitignore und Lizenz weglassen und auf „Create repository“ klicken.',
      soloTokenText:
        'Das Token gehört zu deinem eigenen Konto und muss von niemandem freigegeben werden. Es erreicht nur dieses eine Repository.',
      soloLater:
        'Später zu mehreren? Übertrage das Repository in eine kostenlose GitHub-Organisation und durchlaufe diesen Assistenten noch einmal als Team. Ein Repository in einem persönlichen Konto lässt sich nicht mit fein abgestuften Tokens teilen.',
      baseTitle: 'Mitgliedern Schreibzugriff geben',
      baseText:
        'Unter „Base permissions“ Write wählen. Dann kann jedes Mitglied ins Daten-Repository schreiben, und du musst niemanden einzeln hinzufügen.',
      baseCaveat:
        'Write gilt für alle Repositories von {{org}}. Verwende eine Organisation, die nur die Zeitdaten enthält.',
      baseLink: 'Member privileges öffnen',
      approvalTitle: 'Über die Token-Freigabe entscheiden',
      approvalText:
        'Neue Organisationen verlangen, dass ein Owner jedes Token eines Mitglieds freigibt. Bis dahin schlägt die Anmeldung des Mitglieds fehl. Im Reiter „Fine-grained tokens“ kannst du das ausschalten.',
      approvalOff: 'Freigabe ausschalten (empfohlen für kleine Teams, denen du vertraust)',
      approvalOffHint:
        '„Do not require administrator approval“ wählen und auf Save klicken. Mitglieder können sich direkt nach dem Erstellen ihres Tokens anmelden.',
      approvalOn: 'Freigabe beibehalten',
      approvalOnHint:
        'Du gibst jedes Token unter Pending requests frei. Die nächsten Schritte erinnern dich daran.',
      approvalLink: 'Token-Richtlinie öffnen',
      inviteTitle: 'Mitglieder einladen',
      inviteText:
        'Lade jede Person über ihren GitHub-Benutzernamen mit der Rolle Member ein. Sie bekommt eine E-Mail und muss die Einladung annehmen.',
      inviteLink: 'People öffnen',
      cliTitle: 'Schneller mit der GitHub CLI',
      cliText:
        'Du hast die GitHub CLI (gh) installiert? Gib die Benutzernamen ein und füge die Befehle in ein Terminal ein. Sie legen das Repository an, setzen die Base permission auf Write und laden alle ein – Schritt 2, 3 und 5 kannst du dann abhaken.',
      cliUsers: 'GitHub-Benutzernamen (mit Komma oder Leerzeichen getrennt)',
      cliInvalid: 'Keine gültigen GitHub-Benutzernamen: {{names}}',
      cliCopy: 'Befehle kopieren',
      tokenTitle: 'Eigenes Token erstellen',
      tokenText: 'Als Owner braucht dein eigenes Token keine Freigabe.',
      shareTitle: 'Team einladen',
      shareText:
        'Schick diese Nachricht an deine Mitglieder. Der Link führt sie in der richtigen Reihenfolge durch alles. Du findest ihn später auch unter Einstellungen.',
      shareLinkLabel: 'Einladungslink',
      copyLink: 'Link kopieren',
      copyMessage: 'Nachricht kopieren',
      shareApproval:
        'Du hast die Freigabe beibehalten: Wenn ein Mitglied meldet, dass sein Token fertig ist, gib es hier frei.',
      pendingLink: 'Pending requests öffnen',
      signInTitle: 'Anmelden',
      signInText: 'Füge dein Token ein. Die erste Anmeldung richtet das leere Repository ein.',
    },
    join: {
      title: '{{repo}} beitreten',
      intro:
        'Vier kurze Schritte. Bitte in dieser Reihenfolge, sonst funktioniert das Token nicht.',
      inviteTitle: 'Einladung annehmen',
      inviteText:
        'Du hast eine E-Mail von GitHub bekommen. Nimm die Einladung zu {{org}} dort oder hier an.',
      inviteLink: 'Einladung öffnen',
      inviteRepoHint: 'Zum Repository statt zu einer Organisation eingeladen?',
      inviteRepoLink: 'Repository-Einladung öffnen',
      accessTitle: 'Zugriff prüfen',
      accessText:
        'Öffne das Repository, während du bei GitHub angemeldet bist. Siehst du es? Es darf leer sein.',
      accessLink: '{{repo}} öffnen',
      accessYes: 'Ich sehe es',
      accessNo: 'Ich bekomme eine 404-Seite',
      accessMissing:
        'Du hast noch keinen Zugriff. Erstelle jetzt noch kein Token: Ein Token, das vor dem Zugriff erstellt wird, funktioniert nicht. Schick diese Nachricht an den Owner und prüfe danach erneut.',
      accessAgain: 'Erneut prüfen',
      tokenTitle: 'Token erstellen',
      tokenLocked: 'Wird freigeschaltet, sobald du das Repository siehst.',
      signInTitle: 'Anmelden',
      changeRepo: 'Repository ändern',
      invalid:
        'Dieser Einladungslink ist ungültig. Bitte die Person, die ihn geschickt hat, um einen neuen, oder gib das Repository unten ein.',
    },
    team: {
      title: 'Mitglieder einladen',
      text: 'Neue Mitglieder brauchen eine Einladung in die Organisation {{org}} und danach den Einladungslink. Er führt sie durch den Rest.',
      addTitle: 'Mitglied hinzufügen',
      addText:
        'Lade die Person unter People mit der Rolle Member ein oder verwende die GitHub CLI.',
      pendingText:
        'Verlangt deine Organisation eine Token-Freigabe, gibst du neue Tokens hier frei:',
    },
  },
  footer: {
    tagline: 'Kostenlose Open-Source-Zeiterfassung.',
    github: 'Quellcode',
    issues: 'Problem melden',
    security: 'Sicherheit',
    license: 'Lizenz',
    madeBy: 'Erstellt von',
    clockifyAlternative: 'Clockify-Alternative',
    importGuide: 'Import aus Clockify',
  },
  readOnly:
    'Die Daten wurden von einer neueren Version dieser App gespeichert. Du kannst sie ansehen, Änderungen sind aber deaktiviert, bis du die App neu lädst oder aktualisierst.',
  framed: {
    text: 'Zu deiner Sicherheit läuft Workaddict nicht innerhalb einer anderen Seite.',
    open: 'Workaddict öffnen',
  },
  dataProblems: {
    title: 'Einige Daten im Repository konnten nicht gelesen werden und werden nicht angezeigt:',
    hint: 'Die App lässt diese Dateien unverändert. Bitte einen Owner, sie auf GitHub zu reparieren.',
    more: 'und {{count}} weitere',
  },
  timer: {
    placeholder: 'Woran arbeitest du?',
    start: 'Start',
    stop: 'Stopp',
    discard: 'Timer verwerfen',
    discardConfirm: 'Laufenden Timer verwerfen? Es wird kein Zeiteintrag gespeichert.',
    modeTimer: 'Timer',
    modeManual: 'Manuell',
    alreadyStopped: 'Dieser Timer wurde bereits auf einem anderen Gerät gestoppt.',
    previousStopped: 'Der vorherige Timer wurde gestoppt und gespeichert.',
    saved: 'Gespeichert. Tippe in der Liste auf eine Zeit, um sie zu korrigieren.',
    runningSince: 'Läuft seit {{time}}',
    runningSinceLabel: 'Läuft seit',
    editStart: 'Startzeit bearbeiten',
    errors: {
      invalidStart: 'Gib eine gültige Startzeit ein.',
      startInFuture: 'Der Start darf nicht in der Zukunft liegen.',
    },
  },
  closeStop: {
    title: 'Dein Timer läuft noch',
    message:
      '„{{description}}“ lief noch, als du Workaddict um {{time}} geschlossen hast (vor {{ago}}).',
    stopAt: 'Um {{time}} stoppen',
    keep: 'Weiterlaufen lassen',
    stopNow: 'Jetzt stoppen',
  },
  team: {
    title: 'Team jetzt',
    tracking: '{{count}} aktiv',
    today: 'Heute {{time}}',
    lastActive: 'Zuletzt aktiv {{time}}',
    noEntriesToday: 'Heute keine Einträge',
    tooLong: 'Läuft ungewöhnlich lange',
    stop: 'Timer von {{login}} stoppen',
    discard: 'Timer von {{login}} verwerfen',
    stopTitle: 'Timer von {{login}} stoppen',
    tooLongWarning:
      'Dieser Timer läuft seit {{elapsed}}. Wurde er vergessen? Prüfe die Endzeit, bevor du ihn stoppst.',
    discardConfirm:
      'Laufenden Timer von {{login}} verwerfen? Es wird kein Zeiteintrag gespeichert.',
    stopped: 'Der Timer von {{login}} wurde gestoppt und gespeichert.',
    discarded: 'Der Timer wurde verworfen.',
    timerChanged: 'Der Timer wurde inzwischen gestoppt oder neu gestartet. Nichts wurde geändert.',
    stoppedByOther: 'Dein Timer wurde von {{login}} gestoppt.',
    note: 'Nur Bearbeiter und Teamleiter sehen das. Die App setzt das durch, nicht GitHub: Jedes Mitglied kann laufende Timer im Daten-Repository lesen.',
    errors: {
      invalidEnd: 'Gib ein gültiges Datum und eine gültige Endzeit ein.',
      beforeStart: 'Das Ende muss nach dem Start liegen.',
      inFuture: 'Das Ende darf nicht in der Zukunft liegen.',
      tooLongEntry: 'Ein Zeiteintrag darf höchstens 24 Stunden lang sein.',
    },
  },
  manual: {
    date: 'Datum',
    start: 'Beginn',
    end: 'Ende',
    duration: 'Dauer',
    durationPlaceholder: '1:30',
    useDuration: 'Stattdessen Dauer eingeben',
    useEnd: 'Stattdessen Endzeit eingeben',
    add: 'Eintrag hinzufügen',
    preview: 'Dauer: {{duration}}',
    nextDay: 'endet am nächsten Tag',
    errors: {
      invalidStart: 'Gib ein gültiges Datum und eine gültige Startzeit ein.',
      invalidEnd: 'Gib eine gültige Endzeit ein.',
      invalidDuration: 'Die Dauer muss größer als 0 und höchstens 24 Stunden sein.',
    },
    added: 'Eintrag hinzugefügt.',
  },
  entries: {
    editDescription: 'Beschreibung bearbeiten',
    editStart: 'Startzeit bearbeiten',
    editEnd: 'Endzeit bearbeiten',
    editDuration: 'Dauer bearbeiten',
    today: 'Heute',
    yesterday: 'Gestern',
    me: 'Ich',
    everyone: 'Alle',
    loadOlder: 'Ältere Einträge laden',
    loadingOlder: 'Ältere Einträge werden geladen…',
    empty: 'Noch keine Zeiteinträge',
    emptyHint: 'Starte den Timer oder füge einen Eintrag manuell hinzu.',
    continue: 'Fortsetzen',
    editTitle: 'Zeiteintrag bearbeiten',
    deleteConfirm: 'Diesen Zeiteintrag löschen?',
    deleted: 'Eintrag gelöscht.',
    saved: 'Eintrag gespeichert.',
    total: 'Gesamt',
  },
  workGroups: {
    roleHint: 'Nur Bearbeiter und die Teamleitung können Projekte und Tags ändern.',
    title: 'Projekte & Tags',
    projects: 'Projekte',
    tags: 'Tags',
    newProject: 'Name des neuen Projekts',
    newTag: 'Name des neuen Tags',
    color: 'Farbe',
    showArchived: 'Archivierte anzeigen',
    archive: 'Archivieren',
    unarchive: 'Wiederherstellen',
    totalHours: 'Erfasst',
    showTotals: 'Gesamtstunden anzeigen',
    totalsLoading: 'Gesamtstunden werden geladen…',
    deleteProjectConfirm_one:
      'Projekt „{{name}}“ löschen? Es wird von {{count}} Eintrag verwendet, der dann als „Kein Projekt“ erscheint.',
    deleteProjectConfirm_other:
      'Projekt „{{name}}“ löschen? Es wird von {{count}} Einträgen verwendet, die dann als „Kein Projekt“ erscheinen.',
    deleteTagConfirm_one: 'Tag „{{name}}“ löschen? Er wird von {{count}} Eintrag verwendet.',
    deleteTagConfirm_other: 'Tag „{{name}}“ löschen? Er wird von {{count}} Einträgen verwendet.',
    deleteProjectUnknown:
      'Projekt „{{name}}“ löschen? Die Zahl der Einträge, die es verwenden, konnte nicht ermittelt werden. Sie erscheinen dann als „Kein Projekt“.',
    deleteTagUnknown:
      'Tag „{{name}}“ löschen? Die Zahl der Einträge, die ihn verwenden, konnte nicht ermittelt werden.',
    nameTaken: 'Dieser Name existiert bereits.',
    nameRequired: 'Gib einen Namen ein.',
    emptyProjects:
      'Noch keine Projekte. Projekte gruppieren Einträge, z. B. nach Kunde oder Produkt.',
    emptyTags:
      'Noch keine Tags. Tags beschreiben die Art der Arbeit, z. B. „Meeting“ oder „Bugfix“.',
  },
  stats: {
    title: 'Statistik',
    range: 'Zeitraum',
    presets: {
      today: 'Heute',
      thisWeek: 'Diese Woche',
      lastWeek: 'Letzte Woche',
      thisMonth: 'Dieser Monat',
      lastMonth: 'Letzter Monat',
      thisYear: 'Dieses Jahr',
      custom: 'Benutzerdefiniert',
    },
    from: 'Von',
    to: 'Bis',
    members: 'Mitglieder',
    projects: 'Projekte',
    tags: 'Tags',
    total: 'Gesamtzeit',
    entryCount: 'Einträge',
    avgPerDay: 'Ø pro erfasstem Tag',
    byProject: 'Nach Projekt',
    byMember: 'Nach Mitglied',
    byTag: 'Nach Tag',
    tagNote: 'Ein Eintrag mit mehreren Tags zählt für jeden davon.',
    share: 'Anteil',
    hours: 'Stunden',
    chartHours: 'Erfasste Zeit',
    chartShare: 'Anteil nach Projekt',
    empty: 'Keine Einträge entsprechen den gewählten Filtern.',
    details: 'Einträge',
    date: 'Datum',
    member: 'Mitglied',
    project: 'Projekt',
    tagsCol: 'Tags',
    description: 'Beschreibung',
    duration: 'Dauer',
    export: 'Exportieren',
    exportGroups: {
      document: 'Dokument',
      spreadsheet: 'Tabelle',
    },
    exportFormats: {
      pdf: 'PDF-Bericht',
      xlsx: 'Excel (.xlsx)',
      ods: 'OpenDocument (.ods)',
      csv: 'CSV (nur Einträge)',
    },
    exportFailed: 'Export fehlgeschlagen. Bitte versuche es erneut.',
    week: 'Woche ab {{date}}',
  },
  exports: {
    reportTitle: 'Zeitbericht',
    generated: 'Erstellt am {{date}}',
    rangeLabel: 'Zeitraum',
    filtersLabel: 'Filter',
    summary: 'Übersicht',
    entries: 'Einträge',
    start: 'Beginn',
    end: 'Ende',
    hours: 'Stunden',
    percent: 'Anteil',
    name: 'Name',
    value: 'Wert',
    allData: 'alle',
  },
  settings: {
    title: 'Einstellungen',
    connection: 'Verbindung',
    repo: 'Daten-Repository',
    user: 'Angemeldet als',
    demoMode: 'Demo-Modus – es wird nichts auf GitHub gespeichert.',
    classicToken:
      'Du bist mit einem klassischen Token angemeldet. Ersetze es durch ein Fine-grained Token, das nur auf das Daten-Repository zugreifen kann.',
    classicTokenRepo:
      'Dieses Token hat den Scope „repo“: Wer es erhält, kann alle privaten Repositories deines Kontos lesen und schreiben.',
    appearance: 'Darstellung',
    language: 'Sprache',
    theme: 'Design',
    themeSystem: 'System',
    themeLight: 'Hell',
    themeDark: 'Dunkel',
    timeFormat: 'Zeitformat',
    timeFormat24: '24 Stunden (14:30)',
    timeFormat12: '12 Stunden (2:30 PM)',
    timer: 'Timer',
    stopOnClose: 'Timer stoppen, wenn ich die Seite schließe',
    stopOnCloseHint:
      'Gilt für dieses Gerät. Wenn du Workaddict wieder öffnest, fragt die App, ob der Timer zu dem Zeitpunkt gestoppt werden soll, als du gegangen bist. Bis dahin zeigen andere Geräte und „Team jetzt“ ihn weiter als laufend.',
    data: 'Daten',
    backupHint:
      'Lade eine vollständige Sicherung aller Einträge aller Mitglieder, Projekte und Tags als JSON-Datei herunter.',
    downloadBackup: 'Sicherung herunterladen',
    logoutHint: 'Entfernt dein Token und zwischengespeicherte Daten aus diesem Browser.',
    about: 'Über',
    version: 'Version',
    madeBy: 'Erstellt von',
    source: 'Quellcode',
    feedback: 'Fehler gefunden oder eine Idee?',
    reportIssue: 'Problem melden',
    security: 'Sicherheit',
    securityPolicy: 'Sicherheitsrichtlinie',
    license: 'Lizenz',
  },
  roles: {
    title: 'Team & Rollen',
    owner: 'Besitzer',
    leader: 'Teamleitung',
    editor: 'Bearbeiter',
    worker: 'Mitarbeiter',
    roleOf: 'Rolle von {{login}}',
    saved: 'Rolle gespeichert.',
    ownerHint:
      'Als Besitzer vergibst du die Rollen. Besitzer (Admins des Daten-Repositorys) sind immer Teamleitung.',
    readOnlyHint: 'Nur Besitzer (Admins des Daten-Repositorys) können Rollen ändern.',
    matrix:
      'Mitarbeiter erfassen ihre eigene Zeit. Bearbeiter können zusätzlich die Einträge aller ändern und Projekte und Tags verwalten. Die Teamleitung kann zusätzlich aus Clockify importieren.',
    enforcement:
      'Rollen werden von dieser App durchgesetzt, nicht von GitHub. Wer Schreibzugriff auf das Daten-Repository hat, kann dessen Dateien weiterhin direkt auf GitHub ändern. Jede Änderung bleibt in der Commit-Historie des Repositorys sichtbar.',
    banner: 'Bis du Rollen vergibst, sind alle außer den Besitzern Mitarbeiter.',
    bannerAction: 'Rollen vergeben',
  },
  import: {
    remapHint:
      'Einen Clockify-Nutzer falsch zugeordnet? Die Teamleitung kann die Einträge später unter Einstellungen → Daten → Einträge umhängen verschieben.',
    title: 'Import aus Clockify',
    settingsHint:
      'Übernimm den Clockify-Verlauf deines Teams (Projekte, Tags und Zeiteinträge) in diesen Arbeitsbereich. Einmalig, bevor ihr mit der Erfassung beginnt.',
    start: 'Aus Clockify importieren',
    replaceHint:
      'Dieser Arbeitsbereich enthält bereits Daten. Der Import ersetzt alle vorhandenen Einträge, Projekte und Tags.',
    replaceWarning:
      'Dieser Arbeitsbereich enthält bereits {{entries}} Einträge, {{projects}} Projekte und {{tags}} Tags aller Mitglieder. Der Import löscht und ersetzt sie; laufende Timer bleiben erhalten. Die alten Daten bleiben in der Git-Historie des Daten-Repositorys und lassen sich durch Zurücksetzen des Import-Commits wiederherstellen.',
    replaceConfirm: 'Mir ist klar, dass alle vorhandenen Daten ersetzt werden',
    confirmReplace: 'Daten ersetzen und {{count}} Einträge importieren',
    next: 'Weiter',
    back: 'Zurück',
    keyIntro:
      'Erstelle in Clockify unter Profileinstellungen → API → Generieren einen API-Schlüssel. Um das ganze Team zu importieren, verwende den Schlüssel eines Clockify-Workspace-Admins.',
    keyLabel: 'Clockify-API-Schlüssel',
    keyNote:
      'Der Schlüssel wird nur für diesen Import verwendet, nur an Clockify gesendet und nie gespeichert.',
    region: 'Clockify-Region',
    regions: {
      global: 'Global (Standard)',
      euc1: 'EU (Deutschland)',
      use2: 'USA',
      euw2: 'Großbritannien',
      apse2: 'Australien',
    },
    checking: 'Wird geprüft…',
    workspace: 'Clockify-Workspace',
    workspaceIntro:
      'Dein Schlüssel hat Zugriff auf mehrere Workspaces. Wähle den zu importierenden aus.',
    loadingMeta: 'Nutzer, Projekte und Tags werden geladen…',
    mapIntro:
      'Wähle, wem die Zeiten jedes Clockify-Nutzers zugeordnet werden. Ehemalige Mitglieder zählen weiter in Statistiken und Exporten, ihre Einträge kann aber niemand bearbeiten.',
    mapUser: 'Clockify-Nutzer',
    mapTarget: 'Importieren als',
    deactivated: 'deaktiviert',
    former: 'Ehemaliges Mitglied ({{login}})',
    skip: 'Nicht importieren',
    duplicateLogin: 'Ein GitHub-Login kann nur einem Clockify-Nutzer zugeordnet werden.',
    nothingSelected: 'Wähle mindestens einen Nutzer zum Importieren aus.',
    loadEntries: 'Zeiteinträge laden',
    fetchIntro: 'Zeiteinträge werden aus Clockify geladen…',
    userPending: 'wartet',
    userDone: '{{count}} Einträge',
    userLoading: 'bisher {{count}} Einträge…',
    userNoAccess: 'kein Zugriff',
    requests: 'Clockify-Anfragen: {{count}}',
    requestsNote:
      'Der Clockify-Free-Plan erlaubt 30 Anfragen pro Stunde. Trenne andere Clockify-Integrationen während des Imports.',
    paused: 'Clockify-Limit erreicht. Weiter ab {{time}}.',
    pausedUnknown: 'Clockify-Limit erreicht. Weiter in etwa einer Stunde.',
    resume: 'Fortsetzen',
    noAccess:
      'Dein Schlüssel kann die Einträge von {{names}} nicht lesen. Nur ein Clockify-Workspace-Admin kann Einträge anderer Nutzer importieren.',
    continueWithout: 'Ohne sie fortfahren',
    previewTitle: 'Vorschau',
    previewIntro: 'Vergleiche diese Summen vor dem Import mit dem Übersichtsbericht in Clockify.',
    projects: 'Projekte',
    tags: 'Tags',
    member: 'Mitglied',
    entries: 'Einträge',
    hours: 'Stunden',
    project: 'Projekt',
    total: 'Gesamt',
    skippedRunning: 'Laufende Timer (nicht importiert): {{count}}',
    skippedInvalid: 'Einträge ohne gültige Dauer (nicht importiert): {{count}}',
    unknownRefs: 'Verweise auf gelöschte Projekte oder Tags entfernt: {{count}}',
    notCarried:
      '{{task}} Einträge mit Aufgabe und {{billable}} abrechenbare Einträge: Aufgaben, Kunden, Abrechenbarkeit und Stundensätze werden nicht importiert.',
    skippedUsers: 'Nicht importiert: {{names}}',
    timeZone:
      'Zeiten werden in der Zeitzone deines Browsers angezeigt; sie kann von der Zeitzone in deinem Clockify-Profil abweichen.',
    confirm: '{{count}} Einträge importieren',
    writing: 'Import läuft… alles wird als ein Commit gespeichert.',
    doneTitle: 'Import abgeschlossen',
    done: '{{entries}} Einträge, {{projects}} Projekte und {{tags}} Tags importiert.',
    deleteKey:
      'Lösche jetzt den API-Schlüssel in Clockify (Profileinstellungen → API). Diese App hat ihn nicht gespeichert.',
    errors: {
      invalidKey: 'Der Clockify-API-Schlüssel ist ungültig',
      forbidden: 'Dieser Schlüssel darf die Clockify-Daten nicht lesen.',
      rateLimit: 'Clockify-Limit erreicht. Weiter ab {{time}}.',
      network: 'Clockify ist nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.',
      unknown: 'Clockify hat einen unerwarteten Fehler gemeldet. Bitte versuche es erneut.',
      noWorkspace: 'Zu diesem Schlüssel gibt es keinen Clockify-Workspace.',
    },
  },
  reassign: {
    start: 'Einträge umhängen',
    settingsHint:
      'Alle Zeiteinträge eines Mitglieds einem anderen zuordnen, z. B. um nach dem Import zu ändern, wie Clockify-Nutzer zugeordnet wurden.',
    title: 'Einträge umhängen',
    intro:
      'Alle ausgewählten Einträge wechseln in einem Commit das Mitglied. Projekte, Tags und Zeiten bleiben gleich. Der vorherige Stand bleibt in der Git-Historie des Daten-Repositorys.',
    from: 'Einträge von',
    to: 'An Mitglied',
    choose: 'Auswählen…',
    former: '{{login}} (ehemaliges Mitglied)',
    count_one: '{{count}} Eintrag',
    count_other: '{{count}} Einträge',
    onlyBefore: 'Nur Einträge, die vor einem Datum begonnen haben',
    cutoff: 'Vor dem',
    cutoffHint:
      'Nimm den Tag des Clockify-Imports, damit Einträge, die das Mitglied danach in Workaddict erfasst hat, bei ihm bleiben.',
    preview_one: '{{count}} Eintrag ({{hours}} h) wird von {{from}} zu {{to}} verschoben.',
    preview_other: '{{count}} Einträge ({{hours}} h) werden von {{from}} zu {{to}} verschoben.',
    nothing: 'Keine passenden Einträge.',
    confirm_one: '{{count}} Eintrag verschieben',
    confirm_other: '{{count}} Einträge verschieben',
    done_one: '{{count}} Eintrag zu {{to}} verschoben.',
    done_other: '{{count}} Einträge zu {{to}} verschoben.',
  },
  errors: {
    auth: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
    forbidden: 'Dein Token darf das nicht. Prüfe seine Berechtigungen.',
    notFound: 'Die Daten wurden nicht gefunden.',
    rateLimit: 'GitHub-Anfragelimit erreicht. Versuche es nach {{time}} erneut.',
    offline: 'Speichern nicht möglich – du bist offline.',
    network: 'GitHub ist nicht erreichbar. Bitte versuche es erneut.',
    conflict: 'Jemand anderes hat gleichzeitig dieselben Daten geändert. Bitte versuche es erneut.',
    schemaTooNew: 'Die Daten wurden von einer neueren App-Version gespeichert.',
    readOnly: 'Änderungen sind deaktiviert, weil die Daten von einer neueren App-Version stammen.',
    notOwner: 'Du kannst nur deinen eigenen Timer ändern.',
    forbiddenRole: 'Deine Rolle erlaubt das nicht. Frag eine Teamleitung oder den Besitzer.',
    invalid: 'Bitte prüfe deine Eingaben.',
    notEmpty:
      'Inzwischen wurden Daten hinzugefügt, daher wurde nichts importiert. Prüfe den Hinweis und versuche es erneut.',
    corruptData:
      'Die Datei {{path}} im Daten-Repository ist beschädigt und wurde daher nicht geändert. Bitte einen Owner, sie auf GitHub zu reparieren.',
    unknown: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  },
}

export default de
