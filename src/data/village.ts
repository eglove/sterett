/**
 * Fixed civic facts that are the same on every page and do not change with
 * the board.
 *
 * Anything a board member edits — trustees, documents, announcements, the
 * office address and phone — lives in the CMS, not here. The footer contact
 * details come from the `footer` widget area; the homepage comes from the
 * Home page's Content field.
 */
export const village = {
	name: "Sterett Creek Village",
	region: "Warsaw, Missouri",
} as const;
