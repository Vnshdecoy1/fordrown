export interface PriceCardData {
  name: string;
  symbol: string;
  icon: string;
  price: string;
  changePct: string;
  positive: boolean;
  volume: string;
}

export interface NavLink {
  label: string;
  href: string;
}

export interface HeaderDropdownGroup {
  title: string;
  links: NavLink[];
}

export interface HeaderDropdown {
  title: string;
  groups: HeaderDropdownGroup[];
}

export interface ProductCard {
  title: string;
  description: string;
  cta: string;
  image: string;
  icon?: string;
  tag?: string;
}

export interface FeatureStat {
  icon: string;
  title: string;
  subtitle: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FooterColumn {
  title: string;
  links: NavLink[];
}
