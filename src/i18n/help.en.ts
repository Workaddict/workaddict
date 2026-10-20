// UI texts of the help system and the glossary. The help pages' content is in
// src/features/help/content/ and loads with the help page.
const help = {
  title: 'Help',
  learnMore: 'Learn more',
  helpFor: 'Help: {{topic}}',
  new: 'New',
  whatIs: {
    'data-repo': 'What is a data repository?',
    token: 'What is a token?',
    workspace: 'What is a workspace?',
  },
  topics: {
    tracking: 'Tracking time',
    token: 'Token & data repository',
    workspaces: 'Workspaces & passphrase',
    roles: 'Roles',
    'work-groups': 'Projects & tags',
    'team-now': 'Team now',
    'issue-links': 'Issue links & project boards',
    'connect-ai': 'Connecting an AI assistant',
    export: 'Export & backup',
    'clockify-import': 'Importing from Clockify',
    'time-zone': 'Time zone',
    shortcuts: 'Keyboard shortcuts',
    glossary: 'Glossary',
  },
  index: {
    intro: 'Short explanations of how Workaddict works. Pick a topic or search.',
    notFound: 'Topic not found. Here are all help topics.',
    search: 'Search help',
    searchPlaceholder: 'e.g. passphrase, export, roles',
    noResults: 'Nothing found. Try another word or browse the topics.',
  },
  page: {
    back: 'All help topics',
    backToApp: 'Back to the app',
    related: 'Related topics',
    helpful: 'Was this helpful?',
    yes: 'Yes',
    no: 'No',
    thanks: 'Thanks for the feedback!',
    askIntro: 'Sorry about that. Ask your question on GitHub, and we will improve this page.',
    ask: 'Ask a question on GitHub',
    loading: 'Loading help…',
  },
  glossary: {
    intro: 'The words Workaddict uses, in one sentence each.',
    terms: {
      'data-repo': {
        term: 'Data repository',
        short:
          'A private GitHub repository that holds all entries, projects and tags as files; Workaddict has no server of its own.',
      },
      token: {
        term: 'Token',
        short:
          'A key you create on GitHub that lets the app read and write the data repository in your name.',
      },
      workspace: {
        term: 'Workspace',
        short:
          'A data repository saved on this device together with its token, so you can switch with one click.',
      },
      passphrase: {
        term: 'Passphrase',
        short:
          'The password that encrypts your saved tokens on this device; it cannot be recovered.',
      },
      demo: {
        term: 'Demo',
        short: 'Try the app with sample data that stays in memory and is never saved.',
      },
      role: {
        term: 'Role',
        short: 'Decides what a member may do: worker, editor or team leader.',
      },
      owner: {
        term: 'Owner',
        short:
          'Someone with admin rights on the data repository on GitHub; owners are always team leaders.',
      },
      leader: {
        term: 'Team leader',
        short:
          'May do everything: manage projects, roles, the team time zone and other members’ entries.',
      },
      editor: {
        term: 'Editor',
        short: 'May manage projects and tags, see Team now and edit or stop other members’ times.',
      },
      worker: {
        term: 'Worker',
        short: 'Tracks their own time and uses the existing projects and tags.',
      },
      project: {
        term: 'Project',
        short: 'What you work on; every entry has at most one project.',
      },
      tag: {
        term: 'Tag',
        short: 'A keyword such as “meeting” or “bugfix”; an entry can have several tags.',
      },
      'team-now': {
        term: 'Team now',
        short:
          'Shows editors and team leaders who is tracking right now and how much everyone tracked today.',
      },
      'issue-link': {
        term: 'Issue link',
        short: 'Connects an entry to a GitHub issue or pull request, e.g. owner/repo#42.',
      },
      'project-board': {
        term: 'Project board',
        short:
          'A GitHub Projects board linked to a project; pasting a card link fills in the issue.',
      },
      mcp: {
        term: 'MCP',
        short:
          'The Model Context Protocol: how an AI assistant such as Claude Code talks to Workaddict.',
      },
      backup: {
        term: 'Backup',
        short: 'One JSON file with all data of the workspace, for safekeeping or moving.',
      },
      'time-zone': {
        term: 'Time zone',
        short:
          'The zone in which times and days are shown: your device’s, the team’s, or one you choose.',
      },
    },
  },
  shortcuts: {
    help: 'Open help',
    close: 'Close a dialog, menu, tip or the tour',
    save: 'Save an edited field',
    cancel: 'Discard the change of an edited field',
    move: 'Move between controls',
  },
  overlay: {
    shortcuts: 'Keyboard shortcuts',
    allTopics: 'All help topics',
    restartTour: 'Restart tour',
    topic: 'Topic',
    term: 'Term',
  },
  tour: {
    stepOf: 'Step {{n}} of {{total}}',
    back: 'Back',
    next: 'Next',
    done: 'Done',
    end: 'End tour',
    label: 'Guided tour',
    steps: {
      timer: {
        title: 'Track your time',
        body: 'Type what you are working on and press Start. Switch to “Manual” to add a time afterwards.',
      },
      entries: {
        title: 'Your entries',
        body: 'Tracked times appear here, grouped by day. Click a description, project or time to change it.',
      },
      filter: {
        title: 'Me or everyone',
        body: 'Switch between your own entries and those of the whole team.',
      },
      teamNow: {
        title: 'Team now',
        body: 'See who is tracking right now and how much everyone tracked today. You can stop a timer that runs too long.',
      },
      workGroups: {
        title: 'Projects & tags',
        body: 'Projects and tags sort your entries. Here they are created, colored and archived.',
      },
      stats: {
        title: 'Statistics',
        body: 'Choose a period and filters to see where the time went, per project, tag and member.',
      },
      export: {
        title: 'Export',
        body: 'Download the filtered statistics as PDF, Excel, OpenDocument or CSV.',
      },
      workspace: {
        title: 'Your workspace',
        body: 'This is the open workspace. Click it to switch to another one or add one.',
      },
      menu: {
        title: 'Your menu',
        body: 'Settings, help, the start page and Lock or Sign out are here.',
      },
      roles: {
        title: 'Team & roles',
        body: 'Decide who is a worker, editor or team leader.',
      },
      help: {
        title: 'Help is always here',
        body: 'Press ? anywhere for help. You can restart this tour or turn on Expert mode in this section.',
      },
    },
  },
  welcome: {
    title: 'Welcome to Workaddict',
    intro:
      'Want a short tour? It takes about a minute and shows where everything is. Nothing is changed in your data.',
    demoIntro: 'Want a short tour of the demo? It takes about a minute.',
    start: 'Start tour',
    later: 'Later',
    no: 'No thanks',
    expert: 'I know my way around',
    expertHint: 'Turns on Expert mode: fewer tips. You can change it in Settings.',
    existingNotice: 'New: help pages and a guided tour. You find them in Settings → Help & guide.',
  },
  checklist: {
    title: 'First steps',
    progress: '{{done}} of {{total}} done',
    dismiss: 'Hide first steps',
    track: 'Track your first time',
    project: 'Create a project',
    tag: 'Create a tag',
    team: 'Invite your team',
    ai: 'Connect an AI assistant (optional)',
    projectWorker: 'Editors and team leaders create projects and tags. How it works',
    open: 'Open',
  },
  settings: {
    title: 'Help & guide',
    expert: 'Expert mode',
    expertHint:
      'Shows fewer tips: no underlined terms, no first steps, no “New” markers and no welcome dialog. Help pages and “?” buttons stay.',
    restartTour: 'Restart tour',
    restartHint: 'Walks you through the app again, page by page.',
    showTips: 'Show tips again',
    showTipsHint: 'Shows the first steps and the welcome dialog again.',
    tipsShown: 'Tips will show again.',
    center: 'Open the help center',
    centerHint: 'All help topics, the glossary and keyboard shortcuts. Tip: press ? anywhere.',
  },
  demoTour: 'Demo with tour',
  shots: {
    'org-new':
      'GitHub’s “Set up your organization” form with the fields “Organization name” and “Contact email”.',
    'repo-new':
      'GitHub’s “Create a new repository” form: “Owner” set to the organization, the “Repository name” field, and “Private” under “Choose visibility”.',
    'base-permission':
      'The organization’s “Member privileges” page with “Base permissions” set to “No permission”.',
    'token-policy':
      'The organization’s “Personal access tokens” settings: “Allow access via fine-grained personal access tokens” and “Require administrator approval” selected.',
    'org-invite': 'The organization’s People page with the green “Invite member” button.',
    'repo-access':
      'The repository’s “Manage access” section with the “Add people” button, where you add members with the “Write” role.',
    'token-form':
      'GitHub’s fine-grained token form: “Resource owner” set to the organization and “Only select repositories” with one repository selected.',
    'token-permissions':
      'The permissions part of the token form: “Contents” set to “Access: Read and write”, and the “Generate token” button.',
    invitation: 'GitHub’s invitation page with the green “Join” button.',
  },
}

export default help
