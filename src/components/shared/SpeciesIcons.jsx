import React from "react";

export const CowIcon = (props) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <ellipse cx="16" cy="19" rx="10" ry="8"/>
    <circle cx="11" cy="17" r="1.2" fill="currentColor" stroke="none"/>
    <circle cx="21" cy="17" r="1.2" fill="currentColor" stroke="none"/>
    <path d="M13 23 Q16 25 19 23"/>
    <path d="M6 19 L3 17 L4 22 L6 21"/>
    <path d="M26 19 L29 17 L28 22 L26 21"/>
    <path d="M11 11 L9 7 L7 8 L9 12"/>
    <path d="M21 11 L23 7 L25 8 L23 12"/>
    <path d="M10 27 L10 31"/><path d="M14 27 L14 31"/>
    <path d="M18 27 L18 31"/><path d="M22 27 L22 31"/>
  </svg>
);

export const SheepIcon = (props) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="16" cy="13" r="6.5"/>
    <circle cx="9" cy="11" r="3"/>
    <circle cx="23" cy="11" r="3"/>
    <circle cx="12" cy="7" r="2.8"/>
    <circle cx="20" cy="7" r="2.8"/>
    <circle cx="16" cy="5" r="2.5"/>
    <ellipse cx="16" cy="17" rx="4" ry="3"/>
    <circle cx="14.2" cy="16.5" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="17.8" cy="16.5" r="0.8" fill="currentColor" stroke="none"/>
    <path d="M15 19 Q16 19.8 17 19"/>
    <path d="M12.5 13 Q9.5 14 10 16.5"/>
    <path d="M19.5 13 Q22.5 14 22 16.5"/>
    <path d="M12 20 L12 28"/>
    <path d="M15 20 L15 28"/>
    <path d="M17 20 L17 28"/>
    <path d="M20 20 L20 28"/>
  </svg>
);

export const HorseIcon = (props) => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 5 L9 15 Q9 23 16 23 Q23 23 23 15 L23 5"/>
    <circle cx="9" cy="10" r="0.9" fill="currentColor" stroke="none"/>
    <circle cx="23" cy="10" r="0.9" fill="currentColor" stroke="none"/>
    <circle cx="11" cy="16" r="0.8" fill="currentColor" stroke="none"/>
    <circle cx="21" cy="16" r="0.8" fill="currentColor" stroke="none"/>
  </svg>
);

export const SPECIES_EMOJI = {
  bovino: "🐄",
  ovino: "🐑",
  equino: "🐴",
  all: "🐾",
};

export const getSpeciesEmoji = (especie) => SPECIES_EMOJI[especie] || "🐾";