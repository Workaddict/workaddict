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
    noTag: 'Kein Label',
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
      'Kopieren ist nicht verfügbar. Der Text ist markiert: Drücke Strg+C (⌘C auf dem Mac).',
  },
  nav: {
    tracker: 'Zeiterfassung',
    stats: 'Statistik',
    workGroups: 'Projekte & Labels',
    settings: 'Einstellungen',
    logout: 'Abmelden',
  },
  login: {
    title: 'Schon eingerichtet? Anmelden',
    subtitle: 'Verbinde dein Daten-Repository mit einem GitHub-Token.',
    token: 'GitHub-Token',
    tokenPlaceholder: 'github_pat_…',
    repo: 'Daten-Repository',
    repoPlaceholder: 'owner/name',
    saveProfile: 'Als Arbeitsbereich auf diesem Gerät speichern',
    saveProfileHint:
      'Speichert das Token auf diesem Gerät, verschlüsselt mit deiner Passphrase, damit du zwischen Arbeitsbereichen wechseln kannst. Nur auf dem eigenen Gerät verwenden, nicht auf gemeinsam genutzten Computern.',
    classicToken:
      'Das ist ein klassisches Token. Es hat meist Zugriff auf alle deine Repositories. Sicherer ist ein Fine-grained Token, das nur auf das Daten-Repository zugreifen kann.',
    classicTokenLink: 'Fine-grained Token erstellen',
    submit: 'Anmelden',
    checking: 'Wird geprüft…',
    sessionExpired:
      'Deine Sitzung ist abgelaufen oder das Token wurde widerrufen. Bitte melde dich erneut an.',
    setupPrompt: 'Noch kein Daten-Repository?',
    setupLink: 'Einrichtung starten',
    errors: {
      badRepoFormat: 'Gib das Repository als owner/name an, z. B. mein-team/zeitdaten.',
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
      back: 'Zurück zur Anmeldung',
      intro:
        'Die App verbindet sich direkt aus deinem Browser mit GitHub. Dafür nutzt sie ein persönliches Zugriffstoken, das nur du kennst.',
      orderTitle: 'Bevor du anfängst',
      order:
        'Nimm die Einladung in die Organisation an und prüfe, ob du das Daten-Repository auf GitHub öffnen kannst. Ein Token, das vor dem Zugriff erstellt wurde, funktioniert nicht.',
      fineTitle: 'Empfohlen: Fine-grained Token',
      approval:
        'Organisationen verlangen standardmäßig, dass ein Owner neue Tokens freigibt. Bis dahin schlägt die Anmeldung fehl. Owner geben frei unter Organisation → Settings → Personal access tokens → Pending requests.',
      openGitHub: 'Token-Formular auf GitHub öffnen',
      classicTitle: 'Gehört das Repository dem persönlichen Konto einer anderen Person?',
      classicText:
        'Fine-grained Tokens funktionieren nur für Repositories, die dir oder einer Organisation gehören, in der du Mitglied bist. Verwende sonst ein klassisches Token mit dem Scope „repo“.',
      classicWarning:
        'Achtung: Ein klassisches „repo“-Token hat Zugriff auf alle deine Repositories. Besser: Daten-Repository in eine kostenlose GitHub-Organisation verschieben.',
      openClassic: 'Klassisches Token auf GitHub erstellen',
      security:
        'Dein Token wird nur in diesem Browser gespeichert und nur an api.github.com gesendet.',
    },
  },
  profiles: {
    title: 'Arbeitsbereiche',
    demo: 'Demo',
    rename: 'Umbenennen',
    name: 'Name des Arbeitsbereichs',
    nameHint: 'Wird in der oberen Leiste und im Umschalter angezeigt. Leer lassen für {{repo}}.',
    renamed: 'Arbeitsbereich umbenannt.',
    switcher: 'Arbeitsbereich: {{name}}. Arbeitsbereich wechseln',
    add: 'Arbeitsbereich hinzufügen',
    addTitle: 'Arbeitsbereich hinzufügen',
    addIntro:
      'Gib das Daten-Repository eines anderen Teams oder Kunden ein. Es wird als Arbeitsbereich auf diesem Gerät gespeichert, damit du mit einem Klick wechseln kannst.',
    addSubmit: 'Arbeitsbereich hinzufügen',
    back: 'Zurück',
    current: 'Aktuell',
    none: 'Noch keine gespeicherten Arbeitsbereiche.',
    pickerTitle: 'Arbeitsbereich wählen',
    signInWithoutSaving: 'Ohne Speichern anmelden',
    lock: 'Sperren',
    remove: 'Entfernen',
    removeThis: 'Diesen Arbeitsbereich entfernen',
    removeConfirm:
      'Arbeitsbereich {{repo}} von diesem Gerät entfernen? Sein Token wird hier gelöscht, wenn kein anderer Arbeitsbereich es nutzt. Auf GitHub ändert sich nichts.',
    switchFailed:
      'Dieser Arbeitsbereich konnte nicht geöffnet werden. Prüfe deine Verbindung und versuche es erneut.',
    openFailed: 'Konnte nicht geöffnet werden',
    timerRunning: 'Timer läuft',
    tokenRejected: 'Token abgelehnt',
    tokenRejectedNotice:
      'GitHub hat das gespeicherte Token abgelehnt. Ersetze es, um mit den betroffenen Arbeitsbereichen weiterzuarbeiten.',
    exists: 'Für {{repo}} gibt es schon einen Arbeitsbereich.',
    openExisting: 'Öffnen',
    replaceToken: 'Token für diesen Arbeitsbereich ersetzen',
    replaceTitle: 'Token für {{repo}} ersetzen',
    replaceIntro:
      'Gib ein neues Token ein. Es ersetzt das gespeicherte für alle Arbeitsbereiche, die es genutzt haben.',
    replaceSubmit: 'Token ersetzen',
    noProfile: 'Für {{repo}} gibt es auf diesem Gerät keinen gespeicherten Arbeitsbereich.',
    reuse: 'Dein Token für {{owner}} verwenden',
    reuseClassic: 'Dein klassisches Token verwenden ({{login}})',
    newToken: 'Neues Token eingeben',
    passphrase: 'Passphrase',
    newPassphrase: 'Neue Passphrase',
    confirmPassphrase: 'Passphrase wiederholen',
    currentPassphrase: 'Aktuelle Passphrase',
    minLength: 'Mindestens {{count}} Zeichen. Ein paar Wörter merkt man sich leicht.',
    strength: {
      weak: 'schwach',
      fair: 'mittel',
      strong: 'stark',
    },
    errors: {
      tooShort: 'Die Passphrase braucht mindestens {{count}} Zeichen.',
      mismatch: 'Die beiden Passphrasen stimmen nicht überein.',
    },
    noRecovery:
      'Die Passphrase lässt sich nicht wiederherstellen. Wenn du sie vergisst, musst du deine Tokens neu eingeben. Auf GitHub geht nichts verloren.',
    createTitle: 'Arbeitsbereiche mit einer Passphrase schützen',
    createIntro:
      'Deine Tokens werden auf diesem Gerät gespeichert, verschlüsselt mit einer Passphrase, die du wählst. Sie verlässt diesen Browser nie.',
    unlockMode: 'Wann nach der Passphrase gefragt wird',
    mode: {
      ask: 'Bei jedem Besuch nach der Passphrase fragen',
      askHint:
        'Offene Tabs teilen den entsperrten Zustand. Nachdem alle Tabs geschlossen sind, fragt die App erneut.',
      stay: 'Auf diesem Gerät entsperrt bleiben',
      stayHint:
        'Speichert einen nicht auslesbaren Schlüssel in diesem Browser, damit du nicht erneut gefragt wirst. Nur für eigene Geräte.',
    },
    working: 'Einen Moment…',
    unlock: 'Entsperren',
    unlockTitle: 'Arbeitsbereiche entsperren',
    unlockIntro:
      'Deine gespeicherten Arbeitsbereiche sind auf diesem Gerät verschlüsselt. Gib deine Passphrase ein.',
    unlockToSave: 'Entsperre deine Arbeitsbereiche, um diesen zu speichern.',
    wrongPassphrase: 'Falsche Passphrase',
    forgot: 'Passphrase vergessen?',
    forgotText:
      'Die Passphrase lässt sich nicht wiederherstellen. Du kannst die Arbeitsbereiche auf diesem Gerät zurücksetzen und dich mit deinen Tokens neu anmelden. Auf GitHub ändert sich nichts.',
    reset: 'Arbeitsbereiche zurücksetzen',
    resetConfirm:
      'Alle gespeicherten Arbeitsbereiche, Tokens und zwischengespeicherten Daten auf diesem Gerät löschen? Du musst deine Tokens neu eingeben. Auf GitHub ändert sich nichts.',
    forgetAll: 'Alle Arbeitsbereiche auf diesem Gerät vergessen',
    forgetHint:
      'Entfernt alle gespeicherten Arbeitsbereiche und Tokens, den gespeicherten Schlüssel und alle zwischengespeicherten Daten aus diesem Browser.',
    forgetConfirm:
      'Alle Arbeitsbereiche auf diesem Gerät vergessen? Alle offenen Tabs werden abgemeldet und du musst deine Tokens neu eingeben. Auf GitHub ändert sich nichts.',
    changePassphrase: 'Passphrase ändern',
    changePassphraseExports: 'Früher exportierte Dateien brauchen weiterhin die alte Passphrase.',
    passphraseChanged: 'Passphrase geändert.',
    export: 'Arbeitsbereiche exportieren',
    exportTitle: 'Arbeitsbereiche exportieren',
    exportWarning:
      'Die Datei enthält deine Tokens, verschlüsselt mit deiner Passphrase. Wer Datei und Passphrase hat, bekommt deinen Zugriff. Ohne Passphrase ist die Datei nutzlos, auch für dich.',
    import: 'Arbeitsbereiche importieren',
    importTitle: 'Arbeitsbereiche importieren',
    importPrompt: 'Arbeitsbereiche von einem anderen Gerät exportiert?',
    importIntro: 'Wähle eine aus Workaddict exportierte Datei (workaddict-workspaces-….json).',
    importFile: 'Datei',
    importReplacesLocked:
      'Die importierte Datei ersetzt die gesperrten Arbeitsbereiche auf diesem Gerät, und ihre Passphrase wird deine.',
    filePassphrase: 'Passphrase der Datei',
    continue: 'Weiter',
    importPassphraseKept: 'Die Passphrase der Datei wird die Passphrase auf diesem Gerät.',
    importMergeIntro:
      'Die Datei enthält {{count}} Arbeitsbereiche. Neue werden hinzugefügt; deine Passphrase bleibt gleich.',
    importConflict: '{{repo}} hat in der Datei ein anderes Token',
    keepLocal: 'Token dieses Geräts behalten',
    useImported: 'Importiertes Token verwenden',
    importErrors: {
      format: 'Das ist keine Workaddict-Arbeitsbereichsdatei.',
      version:
        'Diese Datei stammt von einer neueren Version von Workaddict. Aktualisiere zuerst die App.',
      passphrase: 'Falsche Passphrase für diese Datei. Es wurde nichts importiert.',
    },
    migrationNotice:
      'Dein Token ist unverschlüsselt auf diesem Gerät gespeichert. Schütze es mit einer Passphrase und füge weitere Arbeitsbereiche hinzu.',
    protect: 'Mit Passphrase schützen und Arbeitsbereiche aktivieren',
    protectTitle: 'Token schützen',
    protected: 'Dein Token ist jetzt auf diesem Gerät verschlüsselt.',
    tabOnlyHint:
      'Diese Sitzung gilt nur für diesen Tab. Speichere sie als Arbeitsbereich, um später zurückzuwechseln.',
    saveCurrent: 'Als Arbeitsbereich speichern',
  },
  landing: {
    headline: 'Kostenlose Zeiterfassung. Deine Daten bleiben bei dir.',
    subline: 'Erfasse Zeiten allein oder im Team, ohne Abo, Werbung oder Tracking.',
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
        'Rollen für Mitarbeiter, Bearbeiter und Teamleitung, dazu die Live-Ansicht „Team jetzt“: Wer erfasst gerade Zeit?',
      timerTitle: 'Ein Timer auf allen Geräten',
      timerText:
        'Am Laptop starten, am Handy stoppen. Auch Einträge über Mitternacht sind kein Problem.',
      reportsTitle: 'Auswertungen und Exporte',
      reportsText:
        'Diagramme nach Projekt, Label und Mitglied. Export als PDF, Excel, OpenDocument oder CSV.',
      importTitle: 'Umstieg von Clockify',
      importText:
        'Übernimm Projekte, Einträge und Tags mit dem eingebauten Import. Aus Clockify-Tags werden Labels.',
      importGuide: 'Zur Import-Anleitung',
    },
    stepsTitle: 'So funktioniert’s',
    setup: 'Kostenlos einrichten',
    step1Title: 'Privates Repository anlegen',
    step1Text: 'Ein leeres privates Repository auf GitHub speichert die Daten deines Teams.',
    step1Link: 'Einrichtungs-Anleitung öffnen',
    step2Title: 'Token erstellen',
    step2Text: 'Ein Fine-grained Token, das nur auf dieses Repository zugreifen kann.',
    step2Link: 'Zeig mir, wie',
    step3Title: 'Anmelden',
    step3Text: 'Repository und Token eingeben. Die App richtet beim ersten Mal alles ein.',
    step3Link: 'Zum Anmelden',
    inviteHint:
      'Hast du einen Einladungslink von deinem Team? Öffne ihn, er führt dich durch alle Schritte.',
  },
  onboarding: {
    back: 'Zurück zur Startseite',
    onGitHub: 'Auf GitHub:',
    done: 'Erledigt',
    menu: {
      createOrg: 'Profilbild → Your organizations → New organization',
      newRepo: 'Organisationsseite → Repositories → New repository',
      newRepoOwn: 'Profilbild → Your repositories → New',
      memberPrivileges: 'Organisation → Settings → Member privileges → Base permissions',
      tokenPolicy: 'Organisation → Settings → Personal access tokens → Settings',
      pendingTokens: 'Organisation → Settings → Personal access tokens → Pending requests',
      people: 'Organisation → People → Invite member',
      orgInvitation: 'E-Mail von GitHub oder Organisationsseite → Join',
      repoInvitations: 'E-Mail von GitHub oder Repository-Seite → Accept invitation',
      repo: 'github.com/{{repo}}',
      repoAccess: 'Repository → Settings → Collaborators and teams',
      classicToken:
        'Profilbild → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)',
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
    ownerMsg: {
      greeting: 'Hallo,',
      noAccess:
        'ich kann mich bei unserer Zeiterfassung (Workaddict) mit dem Repository {{repo}} nicht anmelden.',
      login: 'Mein GitHub-Benutzername: {{login}}',
      openPage:
        'Diese Seite zeigt, was du auf GitHub prüfen musst, mit einem Button pro Schritt: {{link}}',
      thanks: 'Danke!',
    },
    inviteMsg: {
      intro:
        'Hallo! Wir erfassen unsere Zeiten mit Workaddict. Unsere Daten liegen im GitHub-Repository {{repo}}. So bist du dabei:',
      accept:
        'Nimm die Einladung in die GitHub-Organisation {{org}} an (E-Mail von GitHub oder hier: {{link}}).',
      open: 'Öffne dann diesen Link und folge den Schritten: {{link}}',
      approval: 'Sag mir Bescheid, wenn du dein Token erstellt hast, damit ich es freigeben kann.',
      acceptRepo:
        'Nimm die Einladung zum GitHub-Repository {{repo}} an (E-Mail von GitHub oder hier: {{link}}).',
      classic: 'Dafür brauchst du ein klassisches GitHub-Token; der Link erklärt, warum und wie.',
    },
    setup: {
      title: 'Team einrichten',
      soloTitle: 'Zeiterfassung einrichten',
      intro:
        'Etwa 10 Minuten, einmalig. Ein Schritt nach dem anderen: Jeder Schritt öffnet die passende GitHub-Seite, danach kommst du hierher zurück. Dein Fortschritt bleibt in diesem Browser gespeichert.',
      soloIntro:
        'Etwa 3 Minuten, einmalig. Ein Schritt nach dem anderen: Jeder Schritt öffnet die passende GitHub-Seite, danach kommst du hierher zurück. Dein Fortschritt bleibt in diesem Browser gespeichert.',
      codeNote:
        'Workaddict verwendet und verändert deine Code-Projekte nicht. Die Zeitdaten liegen in einem eigenen, neuen, leeren Repository.',
      orgNote: 'Die Organisation enthält nur dieses eine Repository. Dein Code bleibt, wo er ist.',
      modeTitle: 'Für wen ist das?',
      modeSolo: 'Nur für mich',
      modeSoloHint: 'Ein privates Repository in deinem eigenen Konto. Drei Schritte.',
      modeTeam: 'Ein Team mit Organisation',
      modeTeamHint:
        'Alle treten einer kostenlosen GitHub-Organisation bei. Die sichersten Tokens. Acht Schritte.',
      modePersonalTeam: 'Ein Team in meinem Konto',
      modePersonalTeamHint:
        'Das Repository bleibt in deinem persönlichen Konto; Mitglieder werden als Collaborators hinzugefügt. Fünf Schritte.',
      compareTitle: 'Welcher Team-Weg passt zu dir?',
      compareOrg: 'Mit Organisation',
      compareRecommended: 'Empfohlen',
      compareOrgPro1: 'Das Token jedes Mitglieds erreicht nur das Repository mit den Zeitdaten.',
      compareOrgPro2: 'Mitglieder und Zugriffe verwaltest du an einer Stelle.',
      compareOrgCon1: 'Du legst eine kostenlose Organisation an (etwa eine Minute).',
      compareOrgCon2: 'Zwei Einstellungen mehr: Base permission und Token-Freigabe.',
      comparePersonal: 'In meinem Konto',
      comparePersonalPro1: 'Keine Organisation nötig. Das Repository bleibt in deinem Konto.',
      comparePersonalPro2: 'Weniger Schritte für dich.',
      comparePersonalCon1:
        'Jedes Mitglied braucht ein klassisches Token. Es kann alle Repositories dieses Mitglieds lesen und ändern, nicht nur die Zeitdaten.',
      comparePersonalCon2:
        'Gelangt so ein Token in falsche Hände, sind alle Repositories des Mitglieds offen.',
      compareBoth:
        'In beiden Fällen bleiben deine Code-Repositories, wo sie sind. Die Zeitdaten kannst du später in eine Organisation verschieben.',
      pros: 'Vorteile',
      cons: 'Nachteile',
      modeLater:
        'Unsicher? Fang mit „Nur für mich“ an. Du kannst später auf eine Organisation umsteigen; das Daten-Repository lässt sich übertragen.',
      org: 'Name der Organisation',
      orgHint: 'Deine neue oder bestehende GitHub-Organisation, z. B. mein-team.',
      orgInvalid: 'Nur Buchstaben, Ziffern und einzelne Bindestriche, höchstens 39 Zeichen.',
      user: 'Dein GitHub-Benutzername',
      userHint: 'Das Konto, zu dem das Repository gehören wird, z. B. mein-name.',
      userInvalid: 'Nur Buchstaben, Ziffern und einzelne Bindestriche, höchstens 39 Zeichen.',
      repo: 'Name des Repositorys',
      repoInvalid: 'Nur Buchstaben, Ziffern, Punkte, Binde- und Unterstriche.',
      namesTitle: 'Dein GitHub-Konto',
      repoLine: 'Daten-Repository: {{repo}}, neu und leer',
      repoChange: 'Namen ändern',
      repoHint: 'Ein neuer Name für die Zeitdaten, keines deiner Code-Projekte.',
      repoPublic:
        '{{repo}} gibt es schon, und es ist öffentlich. Workaddict braucht ein neues, leeres, privates Repository. Wähle einen anderen Namen.',
      accountIsUser: '{{name}} ist ein persönliches Konto, keine Organisation.',
      accountIsUserOr:
        'Oder gib den Namen einer neuen Organisation ein und lege sie in Schritt 1 an.',
      switchToPersonal: 'Team in meinem Konto einrichten',
      accountIsOrg: '{{name}} ist eine Organisation.',
      switchToTeam: 'Team mit dieser Organisation einrichten',
      accountMissing: 'Es gibt kein GitHub-Konto mit diesem Namen.',
      orgMissing: 'Noch nicht auf GitHub. Schritt 1 legt sie an.',
      orgFound: '{{org}} auf GitHub gefunden.',
      doneNext: 'Erledigt, nächster Schritt',
      next: 'Weiter',
      back: 'Zurück',
      stepOf: 'Schritt {{n}} von {{total}}',
      stepFirst: 'Schritt 1',
      notDone: 'Noch nicht erledigt',
      doneMark: 'Erledigt',
      doneWhen: 'Erledigt, wenn:',
      returnTitle: 'Zurück von GitHub. Hast du das gesehen?',
      returnYes: 'Ja, nächster Schritt',
      returnNo: 'Nein, hilf mir',
      helpTitle: 'Häufige Fehler',
      lockedOrg:
        'Gib oben einen gültigen Namen für die Organisation ein, um diesen Schritt zu öffnen.',
      lockedUser: 'Gib oben einen gültigen GitHub-Benutzernamen ein, um diesen Schritt zu öffnen.',
      lockedRepo: 'Korrigiere oben den Namen des Repositorys, um diesen Schritt zu öffnen.',
      progress: '{{done}} von {{total}} erledigt',
      reset: 'Neu beginnen',
      orgTitle: 'Kostenlose Organisation anlegen',
      orgText:
        'Wähle den Free-Plan und nenne sie {{org}}. Mitglieder hinzufügen kannst du vorerst überspringen. Hast du schon eine Organisation? Dann markiere diesen Schritt als erledigt.',
      orgDoneWhen: 'GitHub zeigt die Seite deiner Organisation {{org}}.',
      orgHelp:
        'Wähle den Free-Plan; ein bezahlter Plan ist nicht nötig.\nDer Name ist vergeben? Wähle einen anderen und gib ihn oben ein.\nGitHub fragt, ob sie dir oder einem Unternehmen gehört: Beides funktioniert.',
      orgWhy:
        'Warum eine Organisation? Nur dann kann jedes Mitglied ein sicheres Token verwenden, das ausschließlich das Daten-Repository erreicht.',
      orgLink: 'Organisation anlegen',
      repoTitle: 'Neues, leeres Repository anlegen',
      repoDoneWhen:
        'GitHub zeigt das neue, leere Repository {{org}}/{{repo}} mit dem Kasten „Quick setup“.',
      repoHelp:
        'Owner muss {{org}} sein, kein anderes Konto.\nVisibility muss Private sein.\nREADME, .gitignore und Lizenz weglassen, damit das Repository leer bleibt.\nDas ist ein neues Repository für die Zeitdaten, nicht dein Code-Projekt.',
      repoText:
        'Das Formular ist vorausgefüllt: Owner {{org}}, Name {{repo}}, privat. README, .gitignore und Lizenz weglassen und auf „Create repository“ klicken.',
      repoLink: '{{org}}/{{repo}} anlegen',
      soloRepoText:
        'Das Formular ist vorausgefüllt: Owner {{org}}, Name {{repo}}, privat. README, .gitignore und Lizenz weglassen und auf „Create repository“ klicken.',
      soloTokenText:
        'Das Token gehört zu deinem eigenen Konto und muss von niemandem freigegeben werden. Es erreicht nur dieses eine Repository.',
      soloLater:
        'Später zu mehreren? Wähle oben „Ein Team in meinem Konto“ oder übertrage das Repository in eine kostenlose GitHub-Organisation. Fein abgestufte Tokens anderer Personen erreichen kein Repository in deinem persönlichen Konto.',
      baseTitle: 'Mitgliedern Schreibzugriff geben',
      baseText:
        'Unter „Base permissions“ Write wählen. Dann kann jedes Mitglied ins Daten-Repository schreiben, und du musst niemanden einzeln hinzufügen.',
      baseCaveat:
        'Write gilt für alle Repositories von {{org}}. Verwende eine Organisation, die nur die Zeitdaten enthält.',
      baseLink: 'Member privileges öffnen',
      baseDoneWhen: '„Base permissions“ zeigt Write, und GitHub hat die Änderung bestätigt.',
      baseHelp:
        'Nur Owner von {{org}} sehen deren Settings.\nUnter „Base permissions“ Write wählen, nicht Read.',
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
      approvalDoneWhen:
        'Du hast oben eine Option gewählt und dieselbe Wahl auf GitHub gespeichert.',
      approvalHelp:
        'Die Einstellung liegt in den Settings der Organisation, nicht in deinem eigenen Profil.\nAuf der GitHub-Seite unten auf Save klicken.',
      inviteTitle: 'Mitglieder einladen',
      inviteText:
        'Lade jede Person über ihren GitHub-Benutzernamen mit der Rolle Member ein. Sie bekommt eine E-Mail und muss die Einladung annehmen.',
      inviteLink: 'People öffnen',
      inviteDoneWhen: 'Jedes Mitglied steht unter People, als Member oder mit offener Einladung.',
      inviteHelp:
        'Rolle Member verwenden, nicht Owner.\nMitglieder müssen die Einladungs-E-Mail annehmen, bevor sie beitreten können.',
      collaboratorsTitle: 'Mitglieder hinzufügen',
      collaboratorsText:
        'Auf „Add people“ klicken und jedes Mitglied über seinen GitHub-Benutzernamen hinzufügen. Es bekommt eine E-Mail und muss die Einladung annehmen.',
      collaboratorsLink: 'Collaborators öffnen',
      collaboratorsDoneWhen:
        'Jedes Mitglied steht unter „Manage access“, mit offener Einladung, bis es sie annimmt.',
      collaboratorsHelp:
        'GitHub fragt eventuell zuerst nach deinem Passwort.\nMitglieder müssen die Einladungs-E-Mail annehmen, bevor sie beitreten können.',
      cliTitle: 'Schneller mit der GitHub CLI',
      cliText:
        'Ist die GitHub CLI (gh) installiert? Dann gib die Benutzernamen ein und füge die Befehle in ein Terminal ein. Sie legen das Repository an, setzen die Base permission auf Write und laden alle ein. Die Schritte 2, 3 und 5 kannst du dann abhaken.',
      cliUsers: 'GitHub-Benutzernamen (mit Komma oder Leerzeichen getrennt)',
      cliInvalid: 'Keine gültigen GitHub-Benutzernamen: {{names}}',
      cliCopy: 'Befehle kopieren',
      tokenTitle: 'Eigenes Token erstellen',
      tokenText: 'Als Owner braucht dein eigenes Token keine Freigabe.',
      personalTokenText:
        'Das Repository liegt in deinem Konto, also kann dein eigenes Token ein fein abgestuftes sein, das nur dieses Repository erreicht.',
      tokenDoneWhen:
        'GitHub zeigt dein neues Token einmal an (github_pat_…). Kopiere es; du fügst es im letzten Schritt ein.',
      tokenHelp:
        'Resource owner muss {{org}} sein.\nUnter Repository access nur {{org}}/{{repo}} auswählen.\nPermissions: Contents → Read and write.\nDas Token wird nur einmal angezeigt. Verloren? Erstelle ein neues.',
      shareTitle: 'Team einladen',
      shareText:
        'Schick diese Nachricht an deine Mitglieder. Der Link führt sie in der richtigen Reihenfolge durch alles. Du findest ihn später auch unter Einstellungen.',
      shareLinkLabel: 'Einladungslink',
      personalShareText:
        'Schick diese Nachricht an deine Mitglieder. Das Repository liegt in deinem persönlichen Konto, daher brauchen sie ein klassisches Token; der Link führt sie durch.',
      shareDoneWhen: 'Du hast die Nachricht an deine Mitglieder geschickt.',
      shareHelp: 'Kopiere die Nachricht oben und schick sie per E-Mail oder Chat.',
      copyLink: 'Link kopieren',
      copyMessage: 'Nachricht kopieren',
      shareApproval:
        'Du hast die Freigabe beibehalten: Wenn ein Mitglied meldet, dass sein Token fertig ist, gib es hier frei.',
      pendingLink: 'Pending requests öffnen',
      signInTitle: 'Einrichtung prüfen und anmelden',
      signInText:
        'Füge dein Token ein. Fehlt etwas, sagt dir Workaddict, welchen Schritt du wiederholen musst. Die erste Anmeldung richtet das leere Repository ein.',
    },
    join: {
      title: '{{repo}} beitreten',
      intro:
        'Vier kurze Schritte. Bitte in dieser Reihenfolge, sonst funktioniert das Token nicht.',
      inviteTitle: 'Einladung annehmen',
      inviteText:
        'Du hast eine E-Mail von GitHub bekommen. Nimm die Einladung zu {{org}} dort oder hier an.',
      inviteLink: 'Einladung öffnen',
      inviteRepoHint: 'Wurdest du zum Repository statt zu einer Organisation eingeladen?',
      inviteTextRepo:
        'Du hast eine E-Mail von GitHub bekommen. Nimm dort oder hier die Einladung zum Repository {{repo}} an.',
      classicIntro:
        '{{owner}} hat das Repository in einem persönlichen Konto. Fein abgestufte Tokens erreichen es nicht, daher brauchst du ein klassisches Token.',
      classicWarning:
        'Ein klassisches Token mit dem Scope „repo“ kann alle deine Repositories lesen und ändern. Halte es geheim und lass es ablaufen.',
      classicNote: 'Note: „Workaddict“ ist schon eingetragen.',
      classicExpiry: 'Expiration: 90 Tage oder länger.',
      classicScope: 'Scopes: „repo“ ist schon angehakt. Alles andere frei lassen.',
      classicGenerate:
        'Auf „Generate token“ klicken und das Token kopieren (es beginnt mit ghp_). GitHub zeigt es nur einmal.',
      classicOpen: 'Formular für klassische Tokens öffnen',
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
      personalText:
        'Neue Mitglieder brauchen eine Einladung zum Repository {{repo}} und danach den Einladungslink. Er führt sie durch den Rest.',
      personalAddText: 'Füge sie in den Repository-Settings unter Collaborators hinzu.',
    },
  },
  fix: {
    title: 'Anmeldung hat nicht geklappt',
    intro: 'Prüfe diese Punkte der Reihe nach und versuche es dann erneut.',
    back: 'Zurück zur Anmeldung',
    setupStep: 'Wahrscheinlich zu wiederholen: der Einrichtungsschritt „{{title}}“.',
    setupStepLink: 'Diesen Schritt öffnen',
    retry: 'Erneut versuchen',
    change: 'Token oder Repository ändern',
    checkedAgain: 'Um {{time}} erneut geprüft. Es klappt noch nicht.',
    ownerTitle: 'Klappt es immer noch nicht? Dann muss ein Owner etwas tun',
    ownerText:
      'Manches kann nur ein Owner von {{owner}} erledigen, zum Beispiel dein Token freigeben oder dir Zugriff geben. Schick ihm diese Nachricht. Sie verlinkt eine Seite, die genau zeigt, was zu klicken ist.',
    copyOwner: 'Nachricht an den Owner kopieren',
    steps: {
      repoFormat:
        'Öffne das Repository auf GitHub und kopiere owner/name aus der Adresszeile: Aus github.com/my-team/time-data wird my-team/time-data.',
      invalidToken:
        'Das Token wurde nicht vollständig kopiert, ist abgelaufen oder wurde gelöscht. Erstelle ein neues:',
      invitation: 'Nimm die Einladung zu {{org}} an.',
      invitationLink: 'Einladung öffnen',
      repoOpen:
        'Öffne das Repository. Zeigt GitHub eine 404-Seite, hast du noch keinen Zugriff und ein Owner muss dich hinzufügen.',
      repoOpenLink: '{{repo}} öffnen',
      resourceOwner:
        'Prüfe dein Token: Resource owner muss {{org}} sein, und unter Repository access muss {{repo}} ausgewählt sein. Ein Token, das du erstellt hast, bevor du Zugriff hattest, funktioniert nie: Lösche es und erstelle ein neues.',
      resourceOwnerGeneric:
        'Prüfe dein Token: Resource owner muss die Organisation sein, der das Repository gehört, und unter Repository access muss das Repository ausgewählt sein. Ein Token, das du erstellt hast, bevor du Zugriff hattest, funktioniert nie: Lösche es und erstelle ein neues.',
      tokensLink: 'Deine Tokens',
      newTokenLink: 'Neues Token erstellen',
      classicScope:
        'Ein klassisches Token braucht den Scope „repo“. Erstelle eines, bei dem der Scope schon ausgewählt ist.',
      classicLink: 'Klassisches Token erstellen',
      ownRepo:
        'Prüfe den Repository-Namen und ob das Token darauf zugreifen darf (Repository access → Only select repositories → {{repo}}).',
      personalFineGrained:
        'Fine-grained Tokens können nur auf Repositories deines eigenen Kontos oder von Organisationen zugreifen, in denen du Mitglied bist. Bitte {{owner}}, das Repository in eine kostenlose GitHub-Organisation zu verschieben, oder verwende ein klassisches Token mit dem Scope „repo“ (es hat Zugriff auf alle deine Repositories).',
      personalInvite:
        'Nimm die Einladung zum Repository an. Gibt es keine, muss {{owner}} dich als Collaborator hinzufügen.',
      readOnlyToken:
        'Dein Token hat nur Contents: Read-only. Erstelle ein neues Token mit Contents: Read and write.',
      offline: 'Prüfe deine Internetverbindung und versuche es dann erneut.',
      rateLimit:
        'GitHub erlaubt nur eine begrenzte Zahl von Anfragen pro Stunde. Warte bis {{time}} und versuche es dann erneut.',
      unknown:
        'Warte kurz und versuche es erneut. Passiert das öfter, hat GitHub vielleicht ein Problem (githubstatus.com).',
    },
  },
  approve: {
    title: '{{member}} kann sich nicht bei eurer Zeiterfassung anmelden',
    titleNeutral: 'Ein Mitglied kann sich nicht bei eurer Zeiterfassung anmelden',
    intro:
      'Daten-Repository {{repo}}. Melde dich auf GitHub als Owner von {{org}} an und geh diese Schritte durch.',
    introUser:
      'Daten-Repository {{repo}}. Melde dich auf GitHub als {{org}} an und füge das Mitglied hinzu.',
    back: 'Workaddict öffnen',
    broken: 'Dieser Link ist fehlerhaft. Bitte das Mitglied, die Nachricht erneut zu kopieren.',
    pendingTitle: 'Token freigeben',
    pendingText:
      'Organisationen verlangen standardmäßig, dass Owner neue Tokens freigeben. Öffne die offenen Anfragen, wähle die Anfrage des Mitglieds und klicke auf Approve.',
    pendingLink: 'Offene Anfragen öffnen',
    emptyHint:
      'Die Liste ist leer oder das Mitglied fehlt darin? Dann ist die Freigabe ausgeschaltet, oder das Token wurde für das eigene Konto des Mitglieds erstellt statt für {{org}}. Dann muss das Mitglied ein neues Token erstellen. Schick ihm diese Notiz:',
    copyNote: 'Notiz für {{member}} kopieren',
    copyNoteNeutral: 'Notiz für das Mitglied kopieren',
    peopleTitle: 'Mitgliedschaft prüfen',
    peopleText:
      'Das Mitglied muss zu {{org}} gehören. Ist die Einladung noch offen, muss es sie zuerst annehmen.',
    peopleLink: 'People öffnen',
    accessTitle: 'Write-Zugriff prüfen',
    accessText:
      'Das Mitglied braucht Write-Zugriff auf {{repo}}: direkt, über ein Team oder über die Basisberechtigung der Organisation.',
    accessLink: 'Collaborators and teams öffnen',
    collaboratorTitle: 'Mitglied als Collaborator hinzufügen',
    collaboratorText:
      'Klicke auf „Add people“ und gib den GitHub-Benutzernamen des Mitglieds ein. Collaborators eines persönlichen Repositorys dürfen schreiben. Danach nimmt das Mitglied die Einladung an.',
    tipTitle: 'Keine Lust, jedes Token freizugeben?',
    tipText:
      'Schalte die Freigabe aus: Wähle „Do not require administrator approval“ und klicke auf Save. Mitglieder können sich dann direkt nach dem Erstellen des Tokens anmelden.',
    tipLink: 'Token-Richtlinie öffnen',
    note: {
      greeting: 'Hallo,',
      text: 'dein Token taucht bei den offenen Anfragen von {{org}} nicht auf. Wahrscheinlich wurde es für dein eigenes Konto erstellt. Bitte erstelle ein neues Token und wähle {{org}} als Resource owner.',
      link: 'Diese Seite erklärt jedes Feld: {{link}}',
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
    start: 'Starten',
    stop: 'Stoppen',
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
    hide: 'Ausblenden',
    show: 'Einblenden',
    showLabel: 'Team jetzt einblenden',
    hideLabel: 'Team jetzt ausblenden',
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
    note: 'Nur Bearbeiter und die Teamleitung sehen das. Das setzt die App durch, nicht GitHub: Jedes Mitglied kann laufende Timer im Daten-Repository lesen.',
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
    stopAndSave: 'Stoppen & speichern',
    runningHint: 'Das ist dein laufender Timer. Beim Speichern wird er mit diesen Zeiten gestoppt.',
    preview: 'Dauer: {{duration}}',
    nextDay: 'endet am nächsten Tag',
    errors: {
      invalidStart: 'Gib ein gültiges Datum und eine gültige Startzeit ein.',
      invalidEnd: 'Gib eine gültige Endzeit ein.',
      invalidDuration: 'Die Dauer muss größer als 0 und höchstens 24 Stunden sein.',
      invalidDate: 'Gib ein gültiges Datum ein.',
    },
    added: 'Eintrag hinzugefügt.',
    for: 'Für',
    me: '{{login}} (ich)',
    addFor: 'Eintrag für {{login}} hinzufügen',
    addedFor: 'Eintrag für {{login}} hinzugefügt.',
  },
  entries: {
    addedBy: 'hinzugefügt von {{login}}',
    editDescription: 'Beschreibung bearbeiten',
    editStart: 'Startzeit bearbeiten',
    editEnd: 'Endzeit bearbeiten',
    editDuration: 'Dauer bearbeiten',
    editDate: 'Datum ändern',
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
    openAgain: 'Erneut öffnen',
    total: 'Gesamt',
  },
  workGroups: {
    roleHint: 'Nur Bearbeiter und die Teamleitung können Projekte und Labels ändern.',
    title: 'Projekte & Labels',
    projects: 'Projekte',
    tags: 'Labels',
    newProject: 'Name des neuen Projekts',
    newTag: 'Name des neuen Labels',
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
    deleteTagConfirm_one: 'Label „{{name}}“ löschen? Es wird von {{count}} Eintrag verwendet.',
    deleteTagConfirm_other: 'Label „{{name}}“ löschen? Es wird von {{count}} Einträgen verwendet.',
    deleteProjectUnknown:
      'Projekt „{{name}}“ löschen? Die Zahl der Einträge, die es verwenden, konnte nicht ermittelt werden. Sie erscheinen dann als „Kein Projekt“.',
    deleteTagUnknown:
      'Label „{{name}}“ löschen? Die Zahl der Einträge, die es verwenden, konnte nicht ermittelt werden.',
    nameTaken: 'Dieser Name existiert bereits.',
    nameRequired: 'Gib einen Namen ein.',
    emptyProjects:
      'Noch keine Projekte. Projekte gruppieren Einträge, z. B. nach Kunde oder Produkt.',
    emptyTags:
      'Noch keine Labels. Labels beschreiben die Art der Arbeit, z. B. „Meeting“ oder „Bugfix“.',
  },
  stats: {
    title: 'Statistik',
    range: 'Zeitraum',
    presets: {
      today: 'Heute',
      thisWeek: 'Diese Woche',
      lastWeek: 'Letzte Woche',
      lastTwoWeeks: 'Letzte 14 Tage',
      thisMonth: 'Dieser Monat',
      lastMonth: 'Letzter Monat',
      thisYear: 'Dieses Jahr',
      allTime: 'Gesamter Zeitraum',
      custom: 'Benutzerdefiniert',
    },
    from: 'Von',
    to: 'Bis',
    members: 'Mitglieder',
    projects: 'Projekte',
    tags: 'Labels',
    total: 'Gesamtzeit',
    entryCount: 'Einträge',
    avgPerDay: 'Ø pro erfasstem Tag',
    byProject: 'Nach Projekt',
    byMember: 'Nach Mitglied',
    byTag: 'Nach Label',
    tagNote: 'Ein Eintrag mit mehreren Labels zählt für jedes davon.',
    share: 'Anteil',
    hours: 'Stunden',
    chartHours: 'Erfasste Zeit',
    chartShare: 'Anteil nach Projekt',
    empty: 'Keine Einträge entsprechen den gewählten Filtern.',
    details: 'Einträge',
    date: 'Datum',
    member: 'Mitglied',
    project: 'Projekt',
    tagsCol: 'Labels',
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
    demoMode: 'Demo-Modus: Es wird nichts auf GitHub gespeichert.',
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
      'Lade eine vollständige Sicherung aller Einträge aller Mitglieder, Projekte und Labels als JSON-Datei herunter.',
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
    owner: 'Owner',
    leader: 'Teamleitung',
    editor: 'Bearbeiter',
    worker: 'Mitarbeiter',
    roleOf: 'Rolle von {{login}}',
    saved: 'Rolle gespeichert.',
    ownerHint:
      'Als Owner vergibst du die Rollen. Owner (Admins des Daten-Repositorys) haben immer die Rolle Teamleitung.',
    readOnlyHint: 'Nur Owner (Admins des Daten-Repositorys) können Rollen ändern.',
    matrix:
      'Mitarbeiter erfassen ihre eigene Zeit. Bearbeiter können zusätzlich die Einträge aller ändern und Projekte und Labels verwalten. Die Teamleitung kann zusätzlich aus Clockify importieren.',
    enforcement:
      'Rollen werden von dieser App durchgesetzt, nicht von GitHub. Wer Schreibzugriff auf das Daten-Repository hat, kann dessen Dateien weiterhin direkt auf GitHub ändern. Jede Änderung bleibt in der Commit-Historie des Repositorys sichtbar.',
    banner: 'Bis du Rollen vergibst, sind alle außer den Ownern Mitarbeiter.',
    bannerAction: 'Rollen vergeben',
  },
  import: {
    remapHint:
      'Hast du einen Clockify-Benutzer falsch zugeordnet? Die Teamleitung kann die Einträge später unter Einstellungen → Daten → Einträge neu zuordnen verschieben.',
    title: 'Import aus Clockify',
    settingsHint:
      'Übernimm den Clockify-Verlauf deines Teams (Projekte, Tags und Zeiteinträge) in diesen Arbeitsbereich. Aus Clockify-Tags werden Labels. Einmalig, bevor ihr mit der Erfassung beginnt.',
    start: 'Aus Clockify importieren',
    replaceHint:
      'Dieser Arbeitsbereich enthält bereits Daten. Der Import ersetzt alle vorhandenen Einträge, Projekte und Labels.',
    replaceWarning:
      'Dieser Arbeitsbereich enthält bereits {{entries}} Einträge, {{projects}} Projekte und {{tags}} Labels aller Mitglieder. Der Import löscht und ersetzt sie; laufende Timer bleiben erhalten. Die alten Daten bleiben in der Git-Historie des Daten-Repositorys und lassen sich durch Zurücksetzen des Import-Commits wiederherstellen.',
    replaceConfirm: 'Mir ist klar, dass alle vorhandenen Daten ersetzt werden',
    confirmReplace: 'Daten ersetzen und {{count}} Einträge importieren',
    next: 'Weiter',
    back: 'Zurück',
    keyIntro:
      'Öffne in Clockify das Kontomenü (oben rechts) → Präferenzen (Preferences) → Tab Erweitert (Advanced) → API-Schlüssel verwalten (Manage API keys) → Generieren. Um das ganze Team zu importieren, verwende den Schlüssel eines Clockify-Workspace-Admins.',
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
    loadingMeta: 'Benutzer, Projekte und Tags werden geladen…',
    mapIntro:
      'Wähle, wem die Zeiten jedes Clockify-Benutzers zugeordnet werden. Ehemalige Mitglieder zählen weiter in Statistiken und Exporten, ihre Einträge kann aber niemand bearbeiten.',
    mapUser: 'Clockify-Benutzer',
    mapTarget: 'Importieren als',
    deactivated: 'deaktiviert',
    former: 'Ehemaliges Mitglied ({{login}})',
    skip: 'Nicht importieren',
    duplicateLogin: 'Ein GitHub-Login kann nur einem Clockify-Benutzer zugeordnet werden.',
    nothingSelected: 'Wähle mindestens einen Benutzer zum Importieren aus.',
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
      'Dein Schlüssel kann die Einträge von {{names}} nicht lesen. Nur ein Clockify-Workspace-Admin kann Einträge anderer Benutzer importieren.',
    continueWithout: 'Ohne sie fortfahren',
    previewTitle: 'Vorschau',
    previewIntro: 'Vergleiche diese Summen vor dem Import mit dem Übersichtsbericht in Clockify.',
    projects: 'Projekte',
    tags: 'Labels',
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
      'Zeiten werden in der Team-Zeitzone angezeigt (oder in der deines Browsers, wenn keine festgelegt ist); sie kann von der Zeitzone in deinem Clockify-Profil abweichen.',
    confirm: '{{count}} Einträge importieren',
    writing: 'Import läuft… Alles wird in einem Commit gespeichert.',
    doneTitle: 'Import abgeschlossen',
    done: '{{entries}} Einträge, {{projects}} Projekte und {{tags}} Labels importiert.',
    deleteKey:
      'Lösche jetzt den API-Schlüssel in Clockify (Kontomenü → Präferenzen → Erweitert → API-Schlüssel verwalten). Diese App hat ihn nicht gespeichert.',
    errors: {
      invalidKey: 'Der Clockify-API-Schlüssel ist ungültig.',
      forbidden: 'Dieser Schlüssel darf die Clockify-Daten nicht lesen.',
      rateLimit: 'Clockify-Limit erreicht. Weiter ab {{time}}.',
      network: 'Clockify ist nicht erreichbar. Prüfe deine Verbindung und versuche es erneut.',
      unknown: 'Clockify hat einen unerwarteten Fehler gemeldet. Bitte versuche es erneut.',
      noWorkspace: 'Zu diesem Schlüssel gibt es keinen Clockify-Workspace.',
    },
  },
  reassign: {
    start: 'Einträge neu zuordnen',
    settingsHint:
      'Alle Zeiteinträge eines Mitglieds einem anderen zuordnen, z. B. um nach dem Import zu ändern, wie Clockify-Benutzer zugeordnet wurden.',
    title: 'Einträge neu zuordnen',
    intro:
      'Alle ausgewählten Einträge wechseln in einem Commit das Mitglied. Projekte, Labels und Zeiten bleiben gleich. Der vorherige Stand bleibt in der Git-Historie des Daten-Repositorys.',
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
  timeZone: {
    title: 'Zeitzone',
    inUse: 'Zeiten werden angezeigt in',
    sourceTeam: 'Team-Zeitzone',
    sourceDevice: 'dieses Gerät',
    sourceBrowser: 'Browser',
    browser: 'Dein Browser meldet',
    browserHidden:
      'Dein Browser meldet UTC. So verbergen Datenschutzeinstellungen oft die echte Zeitzone. Die Zeiten werden stattdessen in {{zone}} angezeigt.',
    browserHiddenNoTeam:
      'Dein Browser meldet UTC. So verbergen Datenschutzeinstellungen oft die echte Zeitzone, daher können die Zeiten verschoben sein. Die Teamleitung kann eine Team-Zeitzone festlegen.',
    differs:
      'Dein Browser ist auf {{browser}} eingestellt, die Zeiten werden aber in {{zone}} angezeigt.',
    team: 'Team-Zeitzone',
    teamHint: 'Gilt für alle Mitglieder, egal, was ihr Browser meldet.',
    teamNone: 'Nicht festgelegt (Zeitzone des jeweiligen Browsers)',
    teamPrompt:
      'Es ist noch keine Team-Zeitzone festgelegt, daher nutzt jeder Browser seine eigene. Leg eine fest, damit alle dieselben Zeiten sehen.',
    teamUse: '{{zone}} verwenden',
    teamSaved: 'Team-Zeitzone auf {{zone}} gesetzt.',
    teamCleared: 'Team-Zeitzone entfernt.',
    device: 'Auf diesem Gerät',
    deviceHint: 'Nur für dieses Gerät, z. B. auf Reisen.',
    deviceTeam: 'Team-Zeitzone',
    deviceBrowser: 'Zeitzone des Browsers',
    invalid: 'Unbekannte Zeitzone.',
    placeholder: 'z. B. Europe/Vienna',
    apply: 'Übernehmen',
    notice:
      'Dein Browser meldet als Zeitzone UTC. Das machen Datenschutzeinstellungen oft. Die Zeiten können daher verschoben angezeigt werden.',
    noticeLeader: 'Team-Zeitzone festlegen',
    noticeMember: 'Bitte die Teamleitung, in den Einstellungen eine Team-Zeitzone festzulegen.',
    noticeDismiss: 'Ausblenden',
  },
  shift: {
    start: 'Zeiten verschieben',
    settingsHint:
      'Die Zeiten der Einträge eines Mitglieds um einen festen Wert verschieben, z. B. um Einträge zu reparieren, die mit einer falschen Zeitzone gespeichert wurden.',
    title: 'Zeiten verschieben',
    intro:
      'Beginn und Ende aller ausgewählten Einträge verschieben sich in einem Commit um denselben Wert. Die Dauer bleibt gleich. Der vorherige Stand bleibt in der Git-Historie des Daten-Repositorys.',
    member: 'Einträge von',
    choose: 'Auswählen…',
    from: 'Von',
    to: 'Bis',
    offset: 'Verschieben um',
    earlier: 'Früher',
    later: 'Später',
    offsetHint: 'Stunden und Minuten, z. B. 2:00. Höchstens 24 Stunden.',
    invalidOffset: 'Gib einen Wert zwischen 0:01 und 24:00 ein.',
    invalidRange: 'Wähle ein Start- und ein Enddatum; das Ende darf nicht vor dem Start liegen.',
    preview_one: '{{count}} Eintrag wird verschoben. Beispiel: {{date}}, {{before}} → {{after}}.',
    preview_other:
      '{{count}} Einträge werden verschoben. Beispiel: {{date}}, {{before}} → {{after}}.',
    nothing: 'Keine passenden Einträge.',
    confirm_one: '{{count}} Eintrag verschieben',
    confirm_other: '{{count}} Einträge verschieben',
    done_one: '{{count}} Eintrag verschoben.',
    done_other: '{{count}} Einträge verschoben.',
  },
  errors: {
    auth: 'Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.',
    forbidden: 'Dein Token darf das nicht. Prüfe seine Berechtigungen.',
    notFound: 'Die Daten wurden nicht gefunden.',
    rateLimit: 'GitHub-Anfragelimit erreicht. Versuche es nach {{time}} erneut.',
    offline: 'Speichern nicht möglich: Du bist offline.',
    network: 'GitHub ist nicht erreichbar. Bitte versuche es erneut.',
    conflict: 'Jemand anderes hat gleichzeitig dieselben Daten geändert. Bitte versuche es erneut.',
    schemaTooNew: 'Die Daten wurden von einer neueren App-Version gespeichert.',
    readOnly: 'Änderungen sind deaktiviert, weil die Daten von einer neueren App-Version stammen.',
    notOwner: 'Du kannst nur deinen eigenen Timer ändern.',
    forbiddenRole: 'Deine Rolle erlaubt das nicht. Frag die Teamleitung oder einen Owner.',
    invalid: 'Bitte prüfe deine Eingaben.',
    notEmpty:
      'Inzwischen wurden Daten hinzugefügt, daher wurde nichts importiert. Prüfe den Hinweis und versuche es erneut.',
    corruptData:
      'Die Datei {{path}} im Daten-Repository ist beschädigt und wurde daher nicht geändert. Bitte einen Owner, sie auf GitHub zu reparieren.',
    unknown: 'Etwas ist schiefgelaufen. Bitte versuche es erneut.',
  },
}

export default de
