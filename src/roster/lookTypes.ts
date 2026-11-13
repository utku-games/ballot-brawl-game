/**
 * The look catalogue: body types, outfits, neckwear, headwear and hand props a fighter can wear.
 * Each value is plain data so the roster stays a table and the view layer decides how every item is drawn.
 * Items are generic caricature pieces with no logos, slogans or brand names.
 */

/** Body proportions; the head card keeps its size on every build. */
export enum Build {
  Average = 'average',
  Tall = 'tall',
  Lanky = 'lanky',
  Short = 'short',
  Round = 'round',
  Stocky = 'stocky',
}

export enum Outfit {
  Suit = 'suit',
  TrouserSuit = 'trouser-suit',
  FrockCoat = 'frock-coat',
  MilitaryCoat = 'military-coat',
  Toga = 'toga',
  Gown = 'gown',
  Doublet = 'doublet',
  Robe = 'robe',
  LabCoat = 'lab-coat',
  Parka = 'parka',
  Turtleneck = 'turtleneck',
  Hoodie = 'hoodie',
  LeatherJacket = 'leather-jacket',
  Casual = 'casual',
}

export enum Neckwear {
  None = 'none',
  Tie = 'tie',
  LongTie = 'long-tie',
  BowTie = 'bow-tie',
  Ruff = 'ruff',
  Cravat = 'cravat',
  GoldCollar = 'gold-collar',
}

export enum Headwear {
  None = 'none',
  TopHat = 'top-hat',
  Bicorne = 'bicorne',
  Crown = 'crown',
  Laurel = 'laurel',
  EgyptianHeaddress = 'egyptian-headdress',
  Homburg = 'homburg',
  RenaissanceCap = 'renaissance-cap',
  Aviators = 'aviators',
}

export enum Prop {
  None = 'none',
  Cigar = 'cigar',
  Sceptre = 'sceptre',
  Quill = 'quill',
  Apple = 'apple',
  Chalk = 'chalk',
  Baton = 'baton',
  Vial = 'vial',
  Paintbrush = 'paintbrush',
  CoilWand = 'coil-wand',
  Sword = 'sword',
  Snake = 'snake',
  Chainsaw = 'chainsaw',
  Mittens = 'mittens',
  Burger = 'burger',
  ToyRocket = 'toy-rocket',
  Dime = 'dime',
  Microphone = 'microphone',
}

/** A fighter's kit in roster-table order: build, outfit, neckwear, headwear, prop. */
export type LookKit = readonly [build: Build, outfit: Outfit, neckwear: Neckwear, headwear: Headwear, prop: Prop];
