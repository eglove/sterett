#!/usr/bin/env node
/**
 * Fills the Home page's rich text content.
 *
 * The homepage is nothing but this one rich text field. Every heading,
 * paragraph, list and image below is ordinary CMS content a board member can
 * edit in the admin UI. This script only exists so the page is populated on a
 * fresh database instead of empty.
 */
import { login, get, put, post, fail } from "./emdash-api.mjs";

const HOME_ID = "01M7X5CYTMPMKNB0J88R2EX65D";

const text = (key, value, marks = []) => ({
	_type: "span",
	_key: key,
	text: value,
	marks,
});

const block = (key, style, children, extra = {}) => ({
	_type: "block",
	_key: key,
	style,
	markDefs: [],
	children,
	...extra,
});

const paragraph = (key, value) => block(key, "normal", [text(`${key}-s`, value)]);
const heading = (key, level, value) => block(key, `h${level}`, [text(`${key}-s`, value)]);

const content = [
	heading("home-title", 1, "Sterett Creek Village"),
	paragraph(
		"home-lede",
		"A residential village on the shores of Truman Lake near Warsaw, Missouri — run by the neighbors who live here.",
	),
	heading("home-welcome", 2, "Welcome to the village"),
	paragraph(
		"home-welcome-p1",
		"Sterett Creek Village is a quiet community of full-time residents and lake-house owners on the Truman Lake shoreline. The village is governed by a board of trustees elected from among the property owners.",
	),
	paragraph(
		"home-welcome-p2",
		"Board meetings are open to residents. They are held at the village office — check the notice board or call the office for the current schedule.",
	),
	heading("home-links", 2, "Village information"),
	block("home-links-list", "normal", [
		text("home-links-s1", "the board of trustees"),
	], {
		listItem: "bullet",
		markDefs: [{ _key: "link-trustees", _type: "link", href: "/trustees" }],
	}),
	block("home-links-2", "normal", [
		text("home-links-s2", "the covenants and village documents"),
	], {
		listItem: "bullet",
		markDefs: [{ _key: "link-covenants", _type: "link", href: "/covenants" }],
	}),
	block("home-links-3", "normal", [
		text("home-links-s3", "the village office"),
	], {
		listItem: "bullet",
		markDefs: [],
	}),
	heading("home-contact", 2, "Contact the village office"),
	paragraph("home-address", "18597 Sterett Creek Village Dr, Warsaw, MO 65355"),
	paragraph("home-phone", "(660) 438-2251"),
	block("home-quote", "blockquote", [
		text("home-quote-s", "The village is what its residents make of it. Come to a meeting."),
	]),
];

// The list items above need their link marks applied to the spans.
const withMarks = content.map((item) => {
	if (item._key === "home-links-list") {
		return { ...item, children: [{ ...item.children[0], marks: ["link-trustees"] }] };
	}
	if (item._key === "home-links-2") {
		return { ...item, children: [{ ...item.children[0], marks: ["link-covenants"] }] };
	}
	return item;
});

login();
const current = await get(`/_emdash/api/content/pages/${HOME_ID}`);
if (fail(current, "read home page")) process.exit(1);

const rev = current.data.item._rev;
const result = await put(`/_emdash/api/content/pages/${HOME_ID}`, {
	data: { content: withMarks },
	_rev: rev,
});
if (fail(result, "update home page")) process.exit(1);

// A content update lands as a draft; publishing is what makes it live.
const published = await post(`/_emdash/api/content/pages/${HOME_ID}/publish`);
if (fail(published, "publish home page")) process.exit(1);

console.log(`home page published: ${withMarks.length} blocks, version ${published.data.item.version}`);
