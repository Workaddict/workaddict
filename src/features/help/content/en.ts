import type { HelpContent } from './types'

const en: HelpContent = {
  tracking: {
    summary:
      'Start a timer while you work, or add a time afterwards. Every entry can have a project, tags and an issue link.',
    sections: [
      {
        heading: 'Timer',
        blocks: [
          'Type what you are working on, choose a project and tags if you like, and click Start. The timer keeps running when you close the page and shows on every device you are signed in on.',
          'Click Stop to save the time as an entry. While a timer runs, the header shows the elapsed time and a stop button on every page.',
        ],
      },
      {
        heading: 'Manual entries',
        blocks: [
          'Switch the timer bar to “Manual” to add a time afterwards: date, start and end, or start and duration. An entry may run past midnight.',
          { note: 'Editors and team leaders can also add an entry for another member.' },
        ],
      },
      {
        heading: 'Changing entries',
        blocks: [
          'Click the description, project, tags or times of an entry in the list to change them right there. Press Enter to save or Esc to discard.',
          'Use “Me” and “Everyone” above the list to switch between your entries and the whole team’s.',
        ],
      },
      {
        heading: 'Stop timer when I close the page',
        blocks: [
          'In Settings you can choose whether the app asks to stop the timer at the moment you left when you open it again. Until then, other devices still show the timer as running.',
        ],
      },
    ],
    related: ['work-groups', 'issue-links', 'time-zone'],
    keywords: ['timer', 'start', 'stop', 'manual', 'entry', 'edit', 'duration', 'overnight'],
  },
  token: {
    summary:
      'Workaddict has no server. Your data lives in a private GitHub repository, and a token lets the app read and write it from your browser.',
    sections: [
      {
        heading: 'The data repository',
        blocks: [
          'All entries, projects, tags and running timers are JSON files in a private repository that you control, for example my-team/time-data.',
          'Every change is a commit with a readable message, so the repository is also a history you can look at and revert.',
          'Each member writes only their own entry and timer files, so members don’t overwrite each other.',
        ],
      },
      {
        heading: 'The token',
        blocks: [
          'A personal access token is like a password for one purpose. You create it on GitHub, and the app sends it only to api.github.com.',
          'Use a fine-grained token limited to the data repository with the permission “Contents: Read and write”. Then the token can’t touch anything else.',
          {
            note: 'Treat the token like a password: don’t share it and don’t paste it on shared computers.',
          },
        ],
      },
      {
        heading: 'Setting up for the first time',
        blocks: [
          'If your team doesn’t have a data repository yet, the setup wizard walks you through it step by step: organization, repository, invitations and token.',
          { link: '/setup', label: 'Start the setup' },
        ],
      },
    ],
    related: ['workspaces', 'roles'],
    keywords: [
      'github',
      'pat',
      'personal access token',
      'repository',
      'sign in',
      'login',
      'fine-grained',
      'classic',
      'setup',
      'repo',
    ],
  },
  workspaces: {
    summary:
      'A workspace is a data repository saved on this device with its token. Several workspaces let you switch between teams with one click.',
    sections: [
      {
        heading: 'Saving a workspace',
        blocks: [
          'When you sign in with “Save as a workspace on this device”, the token is stored in this browser, encrypted with your passphrase.',
          'Without it, you are signed in for this tab only and enter the token again next time.',
        ],
      },
      {
        heading: 'The passphrase',
        blocks: [
          'The passphrase encrypts all saved tokens on this device. It is never sent anywhere.',
          {
            note: 'The passphrase cannot be recovered. If you forget it, reset the workspaces on this device and enter your tokens again. Nothing on GitHub changes.',
          },
          'Unlock modes: “Ask for the passphrase on every visit” is the safest. “Stay unlocked on this device” is convenient on your own computer.',
          '“Lock” in the avatar menu removes the key from all open tabs.',
        ],
      },
      {
        heading: 'Switching and adding',
        blocks: [
          'The name of the open workspace is shown in the top bar. Click it to switch, or choose “+ Add workspace”.',
          'Each tab has its own open workspace, so two tabs can show two teams.',
        ],
      },
      {
        heading: 'Moving to another device',
        blocks: [
          'Settings → Workspaces → “Export workspaces” downloads an encrypted file. Import it on the other device with the same passphrase.',
        ],
      },
    ],
    related: ['token'],
    keywords: [
      'profile',
      'vault',
      'password',
      'unlock',
      'lock',
      'switch',
      'export workspaces',
      'import workspaces',
      'forgot',
    ],
  },
  roles: {
    summary:
      'Every member has one role: worker, editor or team leader. Owners of the data repository are always team leaders.',
    sections: [
      {
        heading: 'What each role may do',
        blocks: [
          {
            list: [
              'Worker: tracks their own time, uses existing projects and tags.',
              'Editor: also creates and changes projects and tags, sees Team now, edits, adds and stops other members’ times.',
              'Team leader: also assigns roles, sets the team time zone, imports from Clockify and shifts or moves entries.',
            ],
          },
          'A member without an assigned role is a worker.',
        ],
      },
      {
        heading: 'Assigning roles',
        blocks: [
          'Owners assign roles in Settings → Team & roles. Each change is saved as a commit that names who changed what.',
        ],
      },
      {
        heading: 'Good to know',
        blocks: [
          {
            note: 'Roles are enforced by the app only. A member with write access to the repository can edit files on GitHub directly, but every change stays visible in the commit history.',
          },
        ],
      },
    ],
    related: ['team-now', 'work-groups'],
    keywords: ['permission', 'owner', 'admin', 'leader', 'editor', 'worker', 'rights', 'team'],
  },
  'work-groups': {
    summary:
      'Projects say what you work on, tags add keywords. Editors and team leaders manage them on the Projects & tags page.',
    sections: [
      {
        heading: 'Projects',
        blocks: [
          'Every entry has at most one project. A project has a unique name and a color.',
          'Archive a project you no longer use: old entries keep it, but it is no longer offered for new ones.',
          'A project can be linked to GitHub repositories and a project board, so issue links are short to type.',
        ],
      },
      {
        heading: 'Tags',
        blocks: [
          'An entry can have any number of tags, for example “meeting” or “bugfix”. Statistics can group by tag.',
        ],
      },
      {
        heading: 'Deleting',
        blocks: [
          'Before deleting, the app says how many entries use the project or tag. The entries stay, without the reference.',
        ],
      },
    ],
    related: ['issue-links', 'roles'],
    keywords: ['project', 'tag', 'label', 'color', 'archive', 'category'],
  },
  'team-now': {
    summary:
      'Team now shows editors and team leaders who is tracking right now and how much everyone tracked today.',
    sections: [
      {
        heading: 'What you see',
        blocks: [
          'Members with a running timer come first, with description, project, tags and elapsed time. Below are the others with their total for today and when their last entry ended.',
          'A timer running longer than 10 hours or since before midnight is marked as running too long.',
        ],
      },
      {
        heading: 'Stopping or discarding a timer',
        blocks: [
          'Stopping saves the timer as an entry with an end time you choose. Discarding removes it without an entry. The member is told who stopped their timer.',
        ],
      },
      {
        heading: 'Hiding the block',
        blocks: ['You can hide Team now; the choice is remembered in this browser.'],
      },
      {
        heading: 'Good to know',
        blocks: [
          {
            note: 'Only the app hides Team now from workers. Every member can read running timers in the data repository on GitHub.',
          },
        ],
      },
    ],
    related: ['roles', 'tracking'],
    keywords: ['live', 'running', 'who', 'today', 'stop', 'discard', 'too long'],
  },
  'issue-links': {
    summary:
      'Connect an entry to the GitHub issue or pull request it belongs to. Statistics and exports show the link.',
    sections: [
      {
        heading: 'What you can paste',
        blocks: [
          {
            list: [
              'owner/repo#42',
              'An issue or pull request link from GitHub',
              'The link of a card on a GitHub Projects board',
              '#42 or 42, when the entry’s project is linked to a repository',
            ],
          },
          'The app shows the link as owner/repo#42 and opens it on GitHub. It never reads your issues through the API.',
        ],
      },
      {
        heading: 'Short form #42',
        blocks: [
          'For #42 the app uses the project’s first linked repository. Without one, it uses the repository of the project’s latest issue link.',
          'Use name#42 to pick another linked repository by its name.',
        ],
      },
      {
        heading: 'Project boards',
        blocks: [
          'A project can link one GitHub Projects board. Open a card on the board, copy the address and paste it into the issue field.',
        ],
      },
    ],
    related: ['work-groups', 'export'],
    keywords: [
      'issue',
      'pull request',
      'pr',
      'board',
      'card',
      'github projects',
      'link',
      'repository',
    ],
  },
  'connect-ai': {
    summary:
      'Your own AI assistant, such as Claude Code, can create projects and suggest entries for your day. Beta.',
    sections: [
      {
        heading: 'How it works',
        blocks: [
          'The assistant runs the Workaddict MCP server on your computer with a token of your own. Workaddict has no server and sees no AI key.',
          'Suggested entries are saved only after you confirm them.',
        ],
      },
      {
        heading: 'Setting it up',
        blocks: [
          'The “Connect AI” page has the commands to copy for Claude Code and the configuration for other assistants.',
          { link: '/connect-ai', label: 'Open Connect AI' },
        ],
      },
      {
        heading: 'Privacy',
        blocks: [
          'Claude Code transcripts are read on your computer only. Only the description you confirm is saved, and the whole team can see it.',
          'The assistant can read and add data but cannot delete anything or change roles.',
        ],
      },
    ],
    related: ['token', 'tracking'],
    keywords: ['ai', 'claude', 'mcp', 'assistant', 'cursor', 'plugin', 'log today', 'automation'],
  },
  export: {
    summary: 'Download statistics as a report or spreadsheet, or all data as a backup.',
    sections: [
      {
        heading: 'Reports and spreadsheets',
        blocks: [
          'On the Statistics page, set the period and filters, then open “Export”:',
          {
            list: [
              'PDF report with totals, charts and the entry list',
              'Excel (.xlsx) and OpenDocument (.ods) with sheets for summary, entries, projects and members',
              'CSV with one row per entry',
            ],
          },
          'Exports contain only what the current filters show.',
        ],
      },
      {
        heading: 'Backup',
        blocks: [
          'Settings → Data → “Download backup” saves all entries of all members, projects and tags as one JSON file.',
          'Your data is also safe in the data repository and its commit history.',
        ],
      },
    ],
    related: ['issue-links', 'clockify-import'],
    keywords: ['pdf', 'excel', 'xlsx', 'ods', 'csv', 'download', 'report', 'backup', 'json'],
  },
  'clockify-import': {
    summary:
      'Team leaders can move projects, tags and time entries from Clockify to Workaddict in one go.',
    sections: [
      {
        heading: 'Before you start',
        blocks: [
          'You need a Clockify API key: account menu (top right) → Preferences → Advanced → Manage API keys → Generate. The key is sent only to Clockify and is not saved.',
          {
            note: 'The import replaces existing entries, projects and tags in the data repository. The app warns you and shows how much will be replaced.',
          },
        ],
      },
      {
        heading: 'The steps',
        blocks: [
          {
            steps: [
              'Settings → Data → start the Clockify import.',
              'Choose the Clockify workspace.',
              'Map each Clockify user to a GitHub login, keep them as a former member, or skip them.',
              'Check the preview and confirm. Everything is written in one commit.',
            ],
          },
          'Clients, tasks, billable flags and rates are not imported.',
          { link: 'seo:import-from-clockify', label: 'Detailed guide: moving from Clockify' },
        ],
      },
      {
        heading: 'Afterwards',
        blocks: [
          'Mapped someone wrongly? Settings → Data → “Reassign entries” moves all entries of one member to another.',
        ],
      },
    ],
    related: ['export', 'roles'],
    keywords: ['clockify', 'import', 'migrate', 'switch', 'api key', 'move'],
  },
  'time-zone': {
    summary:
      'Times and days are shown in one effective time zone, so the whole team sees the same days.',
    sections: [
      {
        heading: 'Which zone is used',
        blocks: [
          {
            steps: [
              'Your device override, if you chose one in Settings',
              'Otherwise the team time zone, set by a team leader',
              'Otherwise the zone your browser reports',
            ],
          },
          'Settings shows the effective zone and where it comes from.',
        ],
      },
      {
        heading: 'Browser reports UTC?',
        blocks: [
          'Some browsers hide the real time zone and report UTC. Then times look shifted. Ask your team leader to set the team time zone.',
          'If times were saved in the wrong zone, team leaders can shift them under Settings → Data → “Shift entry times”.',
        ],
      },
    ],
    related: ['tracking'],
    keywords: ['zone', 'utc', 'timezone', 'shift', 'hours wrong', 'clock'],
  },
}

export default en
