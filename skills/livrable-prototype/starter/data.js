/* Prototype NOM_PROJET: fictional data, all in one place.
   Rendering never hardcodes data: change a value here, the screens follow. */

// Profiles shown in the proto bar. `can` lists the actions allowed to the role (see "Rôles et droits").
const PROFILES = {
  gestionnaire: { label: 'Gestionnaire', can: ['view', 'edit'] },
  lecteur: { label: 'Lecteur', can: ['view'] },
};

// Statuses of the business object, aligned on its life cycle in the functional design.
const STATUSES = {
  brouillon: { label: 'Brouillon', tone: 'neutral' },
  actif: { label: 'Actif', tone: 'ok' },
  clos: { label: 'Clos', tone: 'muted' },
};

// Fictional records. Names, amounts and dates are made up.
const ITEMS = [
  { id: 'D-1001', title: 'Dossier Alpha', owner: 'Agence Nord', status: 'actif', amount: 1250.5, date: '2026-09-12' },
  { id: 'D-1002', title: 'Dossier Bêta', owner: 'Agence Sud', status: 'brouillon', amount: 480, date: '2026-09-20' },
  { id: 'D-1003', title: 'Dossier Gamma', owner: 'Agence Nord', status: 'clos', amount: 9800, date: '2026-08-02' },
];

// User-facing messages, keyed by their id: MSG-xx word for word from the functional design,
// MSG-Uxx from the UX spec. `grep MSG-U03` finds the spec line and every place the proto shows it.
const MESSAGES = {
  'MSG-01': 'Dossier enregistré.',
  'MSG-02': 'Dossier supprimé.',
  'MSG-U01': 'Aucun dossier pour le moment.',
  'MSG-U02': 'Les dossiers n\u2019ont pas pu être chargés.',
  'MSG-U03': 'Vous n\u2019avez pas les droits pour modifier ce dossier.',
  'MSG-U04': 'Ce dossier n\u2019existe pas ou a été supprimé.',
  'MSG-U05': 'Ce champ est obligatoire.',
};

// Interface texts that carry no message id (dialog titles, counters, labels with a variable part).
// Taken from the UX spec as well; a text that should be a message gets its MSG-Uxx in the spec first.
const LABELS = {
  'delete-title': 'Supprimer le dossier',
  'delete-text': 'Le dossier « <title> » sera supprimé.',
};
