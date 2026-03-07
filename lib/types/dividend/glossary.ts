// types/glossary.ts
export interface GlossaryComponent {
  symbol: string;
  definition: string;
  source?: string;
  link_to_feature?: string;
}

export interface GlossaryItem {
  label: string;
  description: string;
  equation: string;
  components: GlossaryComponent[];
}

export interface GlossaryMap {
  [key: string]: GlossaryItem;
}