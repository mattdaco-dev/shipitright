/* Prototype PROJECT_NAME: fictional data, all in one place.
   Rendering never hardcodes data: change a value here, the screens follow. */

// Profiles shown in the proto bar. `can` lists the actions allowed to the role (see "Roles and permissions").
const PROFILES = {
  manager: { label: 'Manager', can: ['view', 'edit'] },
  reader: { label: 'Reader', can: ['view'] },
};

// Statuses of the business object, aligned on its life cycle in the functional design.
const STATUSES = {
  draft: { label: 'Draft', tone: 'neutral' },
  active: { label: 'Active', tone: 'ok' },
  closed: { label: 'Closed', tone: 'muted' },
};

// Fictional records. Names, amounts and dates are made up.
const ITEMS = [
  { id: 'D-1001', title: 'File Alpha', owner: 'North branch', status: 'active', amount: 1250.5, date: '2026-09-12' },
  { id: 'D-1002', title: 'File Beta', owner: 'South branch', status: 'draft', amount: 480, date: '2026-09-20' },
  { id: 'D-1003', title: 'File Gamma', owner: 'North branch', status: 'closed', amount: 9800, date: '2026-08-02' },
];

// User-facing messages, keyed by their id: MSG-xx word for word from the functional design,
// MSG-Uxx from the UX spec. `grep MSG-U03` finds the spec line and every place the proto shows it.
const MESSAGES = {
  'MSG-01': 'File saved.',
  'MSG-02': 'File deleted.',
  'MSG-U01': 'No file yet.',
  'MSG-U02': 'The files could not be loaded.',
  'MSG-U03': 'You do not have the rights to edit this file.',
  'MSG-U04': 'This file does not exist or has been deleted.',
  'MSG-U05': 'This field is required.',
};

// Interface texts that carry no message id (dialog titles, counters, labels with a variable part).
// Taken from the UX spec as well; a text that should be a message gets its MSG-Uxx in the spec first.
const LABELS = {
  'delete-title': 'Delete the file',
  'delete-text': 'The file "<title>" will be deleted.',
};
