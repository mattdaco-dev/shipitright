/* Prototype Réservation de salles: fictional data, all in one place.
   Rendering never hardcodes data: change a value here, the screens follow. */

// Simulated clock: the demo always runs on Monday 05.10.2026 at 10:20 (BR-03 greys what is past).
const NOW = { day: '2026-10-05', time: '10:20' };

// Opening hours and steps of a slot (BR-02, BR-04).
const RULES = { open: '08:00', close: '19:00', step: 15, maxMinutes: 240, seriesMonths: 3, cancelledVisibleDays: 7 };

// Profiles shown in the proto bar, one per role of "Rôles et droits". `user` is the account logged in.
const PROFILES = {
  employe: { label: 'Employé', user: 'u-lea', can: ['view', 'book', 'cancel-own'] },
  gestionnaire: { label: 'Gestionnaire', user: 'u-paul', can: ['view', 'book', 'cancel-own', 'cancel-any', 'manage-rooms'] },
};

// Fictional accounts. Any non-empty password is accepted for these emails (SCR-01).
const USERS = {
  'u-lea': { name: 'Léa Martin', email: 'lea.martin@example.com', profile: 'employe' },
  'u-paul': { name: 'Paul Schmit', email: 'paul.schmit@example.com', profile: 'gestionnaire' },
  'u-marc': { name: 'Marc Weber', email: 'marc.weber@example.com', profile: 'employe' },
  'u-sophie': { name: 'Sophie Muller', email: 'sophie.muller@example.com', profile: 'employe' },
  'u-anne': { name: 'Anne Kremer', email: 'anne.kremer@example.com', profile: 'employe' },
  'u-tom': { name: 'Tom Hoffmann', email: 'tom.hoffmann@example.com', profile: 'employe' },
  'u-julie': { name: 'Julie Reuter', email: 'julie.reuter@example.com', profile: 'employe' },
  'u-nina': { name: 'Nina Thill', email: 'nina.thill@example.com', profile: 'employe' },
};

// Equipment, as in SCR-07.
const EQUIPMENT = {
  ecran: 'Écran',
  visio: 'Visioconférence',
  tableau: 'Tableau blanc',
};

// Rooms. `active: false` = désactivée (BR-08): no row in the grid, last in SCR-06.
const ROOMS = [
  { id: 'r-alzette', name: 'Alzette', capacity: 12, equipment: ['ecran', 'visio'], active: true },
  { id: 'r-moselle', name: 'Moselle', capacity: 8, equipment: ['ecran', 'tableau'], active: true },
  { id: 'r-sure', name: 'Sûre', capacity: 6, equipment: ['ecran'], active: true },
  { id: 'r-our', name: 'Our', capacity: 20, equipment: ['ecran', 'visio', 'tableau'], active: true },
  { id: 'r-clerve', name: 'Clerve', capacity: 4, equipment: ['tableau'], active: true },
  { id: 'r-wiltz', name: 'Wiltz', capacity: 10, equipment: ['visio'], active: true },
  { id: 'r-attert', name: 'Attert', capacity: 6, equipment: ['ecran', 'tableau'], active: true },
  { id: 'r-eisch', name: 'Eisch', capacity: 14, equipment: ['ecran', 'visio'], active: true },
  { id: 'r-mamer', name: 'Mamer', capacity: 4, equipment: [], active: true },
  { id: 'r-syr', name: 'Syr', capacity: 30, equipment: ['ecran', 'visio', 'tableau'], active: true },
  { id: 'r-petrusse', name: 'Pétrusse', capacity: 8, equipment: ['ecran'], active: false },
];

// Reservations. [id, room, user, day, start, end] plus optional fields:
// series (id of the series), status ('active' | 'annulee'), reason and cancelledOn (BR-07, BR-08).
const R = (id, room, user, day, start, end, extra = {}) => ({ id, room, user, day, start, end, status: 'active', series: null, ...extra });

// Léa's weekly series: Sûre every Wednesday 09:00 to 10:00, 07.10 to 25.11.2026.
const LEA_SERIES = ['2026-10-07', '2026-10-14', '2026-10-21', '2026-10-28', '2026-11-04', '2026-11-11', '2026-11-18', '2026-11-25']
  .map((day, i) => R(`b-s1-${i + 1}`, 'r-sure', 'u-lea', day, '09:00', '10:00', { series: 's-1' }));

const RESERVATIONS = [
  // Monday 05.10.2026 (today)
  R('b-101', 'r-alzette', 'u-sophie', '2026-10-05', '08:30', '09:30'),
  R('b-102', 'r-alzette', 'u-lea', '2026-10-05', '10:00', '11:00'), // in progress: no "Annuler" (BR-03)
  R('b-103', 'r-alzette', 'u-tom', '2026-10-05', '14:00', '16:00'),
  R('b-104', 'r-moselle', 'u-marc', '2026-10-05', '09:00', '10:30'),
  R('b-105', 'r-moselle', 'u-anne', '2026-10-05', '13:30', '14:30'),
  R('b-106', 'r-sure', 'u-lea', '2026-10-05', '11:00', '12:00'),
  R('b-107', 'r-sure', 'u-julie', '2026-10-05', '16:00', '17:30'),
  R('b-108', 'r-our', 'u-nina', '2026-10-05', '08:00', '12:00'),
  R('b-109', 'r-clerve', 'u-paul', '2026-10-05', '10:30', '11:30'),
  R('b-110', 'r-clerve', 'u-marc', '2026-10-05', '15:00', '16:00'),
  R('b-111', 'r-wiltz', 'u-sophie', '2026-10-05', '13:00', '14:00'),
  R('b-112', 'r-eisch', 'u-tom', '2026-10-05', '09:15', '10:00'),
  R('b-113', 'r-eisch', 'u-anne', '2026-10-05', '17:00', '18:00'),
  R('b-114', 'r-mamer', 'u-julie', '2026-10-05', '12:00', '13:00'),
  R('b-115', 'r-syr', 'u-nina', '2026-10-05', '11:30', '12:15'),
  // Tuesday 06.10.2026
  R('b-201', 'r-alzette', 'u-anne', '2026-10-06', '09:00', '10:00'),
  R('b-202', 'r-moselle', 'u-tom', '2026-10-06', '14:00', '15:00'),
  R('b-203', 'r-sure', 'u-paul', '2026-10-06', '10:00', '12:00'),
  R('b-204', 'r-our', 'u-lea', '2026-10-06', '13:00', '15:00'),
  R('b-205', 'r-clerve', 'u-julie', '2026-10-06', '08:30', '09:00'),
  R('b-206', 'r-eisch', 'u-marc', '2026-10-06', '15:00', '16:30'),
  R('b-207', 'r-mamer', 'u-sophie', '2026-10-06', '10:00', '11:00'),
  // Wednesday 07.10.2026
  R('b-301', 'r-alzette', 'u-marc', '2026-10-07', '10:00', '12:00'),
  R('b-302', 'r-our', 'u-nina', '2026-10-07', '14:00', '15:00'),
  R('b-303', 'r-attert', 'u-paul', '2026-10-07', '11:00', '12:00'),
  R('b-304', 'r-petrusse', 'u-lea', '2026-10-07', '14:00', '15:00',
    { status: 'annulee', reason: 'salle désactivée', cancelledOn: '2026-10-02' }), // BR-08
  // Thursday 08.10.2026
  R('b-401', 'r-moselle', 'u-julie', '2026-10-08', '09:00', '11:00'),
  R('b-402', 'r-clerve', 'u-tom', '2026-10-08', '13:00', '14:00'),
  R('b-403', 'r-wiltz', 'u-lea', '2026-10-08', '14:00', '15:00',
    { status: 'annulee', reason: 'salle réservée pour la visite de l\'audit interne', cancelledOn: '2026-10-03' }), // BR-07
  R('b-404', 'r-syr', 'u-anne', '2026-10-08', '16:00', '17:00'),
  // Friday 09.10.2026
  R('b-501', 'r-alzette', 'u-sophie', '2026-10-09', '08:00', '09:00'),
  R('b-502', 'r-mamer', 'u-lea', '2026-10-09', '11:00', '12:30'),
  R('b-503', 'r-eisch', 'u-paul', '2026-10-09', '14:00', '15:00'),
  // Tuesday 20.10.2026: the conflict of the CALC-01 example (weekly series on Moselle, 10:00 to 11:00)
  R('b-601', 'r-moselle', 'u-marc', '2026-10-20', '10:00', '11:00'),
  ...LEA_SERIES,
];

// User-facing messages, keyed by their id: MSG-xx word for word from the functional design,
// MSG-Uxx from the UX spec. Variable parts stay between chevrons and are filled by msg().
// `grep MSG-U03` finds the spec line and every place the proto shows it.
const MESSAGES = {
  'MSG-01': 'La salle <nom> est déjà réservée de <début> à <fin>.',
  'MSG-02': 'Réservation confirmée : <salle>, le <date> de <début> à <fin>.',
  'MSG-03': 'Les réservations se font du lundi au vendredi, de 08:00 à 19:00, par pas de 15 minutes, pour 4 heures au plus.',
  'MSG-04': '<n> occurrences sur <total> sont déjà prises et ne seront pas créées.',
  'MSG-05': 'Annulée par le gestionnaire : <motif>.',
  'MSG-06': 'La salle <nom> est désactivée : <n> réservations futures ont été annulées.',
  'MSG-U01': 'Email ou mot de passe incorrect.',
  'MSG-U02': 'Aucune salle n\'est encore déclarée.',
  'MSG-U03': 'L\'occupation n\'a pas pu être chargée.',
  'MSG-U04': 'Aucune salle libre ne correspond. Essayez un autre créneau ou moins d\'équipements.',
  'MSG-U05': 'La recherche n\'a pas abouti.',
  'MSG-U06': 'La réservation n\'a pas pu être enregistrée. Rien n\'a été créé.',
  'MSG-U07': 'Vous n\'avez aucune réservation à venir.',
  'MSG-U08': 'Vos réservations n\'ont pas pu être chargées.',
  'MSG-U09': 'Le parc de salles n\'a pas pu être chargé.',
  'MSG-U10': 'Cette page est réservée au gestionnaire des salles.',
  'MSG-U11': 'La salle n\'a pas pu être enregistrée.',
  // Texts of the spec that have no id yet (see README, "Écarts avec la spec"), keyed by their spec anchor.
  'MSG-08': '<n> réservations futures seront annulées avec le motif « salle désactivée ».',
  'MSG-07': 'Une salle active porte déjà ce nom.',
};

// Interface labels that carry a variable part or a rule, word for word from the spec.
const LABELS = {
  weekend: 'Pas de réservation le week-end',
  occurrences: '<n> occurrences',
  createFree: 'Créer les <n> occurrences libres',
  seriesAll: 'Toutes les occurrences à venir de la série',
  capacity: '<n> places',
  badgeSeries: 'Série',
  defaultMotifDisable: 'salle désactivée',
};
