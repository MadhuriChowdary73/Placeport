/**
 * Centralized configuration constants for PlacePort.
 * Change values here to affect the entire app.
 */

/** Only emails ending with this domain may sign up / log in. */
export const ALLOWED_EMAIL_DOMAIN = 'av.students.amrita.edu'

/** Admin account allowed to log in and moderate feed experiences. */
export const ADMIN_EMAIL = 'madhurichowdary2007@gmail.com'

/** Branding */
export const APP_NAME = 'PlacePort'
export const CAMPUS_NAME = 'Amaravati'
export const UNIVERSITY_NAME = 'Amrita Vishwa Vidyapeetham'

/** Theme colours */
export const THEME = {
  primary: '#A41D35',
  primaryHover: '#8A152A',
  primaryLight: '#FDF2F4',
  primaryBorder: '#F5D0D7',
  gold: '#D4AF37',
} as const
