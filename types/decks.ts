export type ManaColor = "W" | "U" | "B" | "R" | "G" | "C";

export type CardImages = {
  small?: string | null;
  normal?: string | null;
  large?: string | null;
  png?: string | null;
  art_crop?: string | null;
  border_crop?: string | null;
};

export type CardFace = {
  name?: string | null;
  mana_cost?: string | null;
  type_line?: string | null;
  oracle_text?: string | null;
  image_uris?: CardImages | null;
};

export type ScryfallCard = {
  id: string;
  oracle_id?: string | null;
  name: string;
  printed_name?: string | null;
  lang?: string | null;
  set_code?: string | null;
  set_name?: string | null;
  collector_number?: string | null;
  released_at?: string | null;
  rarity?: string | null;
  layout?: string | null;
  mana_cost?: string | null;
  cmc?: number | null;
  type_line?: string | null;
  oracle_text?: string | null;
  colors: string[];
  color_identity: string[];
  legalities: Record<string, unknown>;
  image_uris?: CardImages | null;
  card_faces: CardFace[];
  artist?: string | null;
};

export type Deck = {
  id: string;
  name: string;
  commander_name?: string | null;
  deck_url?: string | null;
  format_slug?: string | null;
  export_text?: string | null;
  image_url?: string | null;
  is_public: boolean;
  cover_scryfall_id?: string | null;
  cover_oracle_id?: string | null;
  cover_focus_x: number;
  cover_focus_y: number;
  mainboard_count: number;
  sideboard_count: number;
  commander_count: number;
  unique_card_count: number;
  color_white: boolean;
  color_blue: boolean;
  color_black: boolean;
  color_red: boolean;
  color_green: boolean;
  color_colorless: boolean;
  color_identity: ManaColor[];
  created_at?: string | null;
  updated_at?: string | null;
};

export type DeckListResponse = { decks: Deck[] };

export type DeckParseError = {
  line_number: number;
  line: string;
  code: string;
  message: string;
  suggestion?: string | null;
};

export type ParsedDeckEntry = {
  name: string;
  quantity: number;
  section: string;
  set_code?: string | null;
  collector_number?: string | null;
  line_numbers: number[];
  resolved: boolean;
  card?: ScryfallCard | null;
};

export type DeckImportPreview = {
  entries: ParsedDeckEntry[];
  errors: DeckParseError[];
  normalized_text: string;
  mainboard_count: number;
  sideboard_count: number;
  commander_count: number;
  total_cards: number;
  unique_card_count: number;
  color_identity: ManaColor[];
  can_save: boolean;
};

export type DeckCard = {
  id: string;
  deck_id: string;
  scryfall_id: string;
  oracle_id?: string | null;
  card_name: string;
  quantity: number;
  section: string;
  sort_order: number;
  card?: ScryfallCard | null;
};

export type DeckCardsResponse = {
  cards: DeckCard[];
  mainboard_count: number;
  sideboard_count: number;
  commander_count: number;
  total_cards: number;
  unique_card_count: number;
};

export type DeckImportResponse = {
  deck: Deck;
  cards: DeckCardsResponse;
  normalized_text: string;
};

export type CoverCardOption = {
  oracle_id: string;
  name: string;
  quantity: number;
  section: string;
  current_printing?: ScryfallCard | null;
};

export type CoverCardOptionsResponse = { cards: CoverCardOption[] };

export type CardArtwork = {
  scryfall_id: string;
  oracle_id?: string | null;
  name: string;
  set_code?: string | null;
  set_name?: string | null;
  collector_number?: string | null;
  released_at?: string | null;
  artist?: string | null;
  image_uris?: CardImages | null;
};

export type ArtworkOptionsResponse = { artworks: CardArtwork[] };
export type CardAutocompleteResponse = { data: string[] };
export type CardSearchResponse = {
  data: ScryfallCard[];
  has_more: boolean;
  next_page?: string | null;
  total_cards?: number | null;
};


export type CardSymbol = {
  symbol: string;
  loose_variant?: string | null;
  english?: string | null;
  transposable: boolean;
  represents_mana: boolean;
  appears_in_mana_costs: boolean;
  mana_value?: number | null;
  colors: string[];
  funny: boolean;
  hybrid: boolean;
  phyrexian: boolean;
  svg_uri: string;
};

export type CardSymbologyResponse = {
  data: CardSymbol[];
};
