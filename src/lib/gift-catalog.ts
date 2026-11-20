/**
 * A small hand-written gift catalog. Each gift is tagged with interests so the
 * poll can be matched to it. Prices are rough, in US dollars.
 *
 * Gifts link to an Amazon search rather than a product: Amazon's product API
 * needs an approved Associates account. If one is approved later, add its
 * `tag=` parameter in `amazonSearchUrl`.
 */
export type CatalogGift = {
  title: string;
  emoji: string;
  priceUsd: number;
  /** Lowercase interest tags this gift suits */
  interests: string[];
  searchQuery: string;
};

export const GIFT_CATALOG: CatalogGift[] = [
  { title: "Gourmet coffee sampler", emoji: "☕", priceUsd: 22, interests: ["coffee", "baking", "cooking"], searchQuery: "gourmet coffee sampler gift set" },
  { title: "Pour-over coffee kit", emoji: "🫖", priceUsd: 35, interests: ["coffee"], searchQuery: "pour over coffee maker kit" },
  { title: "Loose-leaf tea sampler", emoji: "🍵", priceUsd: 18, interests: ["tea", "cooking"], searchQuery: "loose leaf tea sampler gift" },
  { title: "Herb garden starter kit", emoji: "🌱", priceUsd: 24, interests: ["gardening", "plants", "cooking"], searchQuery: "indoor herb garden starter kit" },
  { title: "Mini succulent set", emoji: "🪴", priceUsd: 16, interests: ["plants", "gardening", "decor"], searchQuery: "mini succulent plants set" },
  { title: "Cooperative board game", emoji: "🎲", priceUsd: 28, interests: ["board games", "games", "puzzles"], searchQuery: "cooperative board game for adults" },
  { title: "Card game party pack", emoji: "🃏", priceUsd: 15, interests: ["board games", "games", "cards"], searchQuery: "party card game adults" },
  { title: "1000-piece jigsaw puzzle", emoji: "🧩", priceUsd: 20, interests: ["puzzles", "board games", "art"], searchQuery: "1000 piece jigsaw puzzle" },
  { title: "Running armband and belt set", emoji: "🏃", priceUsd: 19, interests: ["running", "fitness", "jogging"], searchQuery: "running belt phone armband set" },
  { title: "Insulated sports water bottle", emoji: "💧", priceUsd: 25, interests: ["running", "fitness", "hiking", "gym", "cycling"], searchQuery: "insulated sports water bottle" },
  { title: "Resistance band set", emoji: "💪", priceUsd: 17, interests: ["fitness", "gym", "yoga"], searchQuery: "resistance bands set" },
  { title: "Yoga mat", emoji: "🧘", priceUsd: 30, interests: ["yoga", "fitness", "meditation"], searchQuery: "non slip yoga mat" },
  { title: "Compact camping lantern", emoji: "🏕️", priceUsd: 21, interests: ["camping", "hiking", "outdoors"], searchQuery: "rechargeable camping lantern" },
  { title: "Trail snack and mug set", emoji: "⛰️", priceUsd: 26, interests: ["hiking", "camping", "outdoors", "coffee"], searchQuery: "hiking enamel camp mug set" },
  { title: "Bike repair multi-tool", emoji: "🚴", priceUsd: 18, interests: ["cycling", "biking", "diy"], searchQuery: "bike repair multi tool" },
  { title: "Bestselling paperback bundle", emoji: "📚", priceUsd: 24, interests: ["reading", "books", "fiction"], searchQuery: "bestselling paperback book set" },
  { title: "Clip-on book light", emoji: "💡", priceUsd: 12, interests: ["reading", "books"], searchQuery: "rechargeable clip on book light" },
  { title: "Watercolor paint set", emoji: "🎨", priceUsd: 23, interests: ["painting", "art", "drawing", "crafts"], searchQuery: "watercolor paint set beginner" },
  { title: "Sketchbook and pencil set", emoji: "✏️", priceUsd: 16, interests: ["drawing", "art", "sketching"], searchQuery: "sketchbook and drawing pencil set" },
  { title: "Beginner knitting kit", emoji: "🧶", priceUsd: 27, interests: ["knitting", "crafts", "crochet"], searchQuery: "beginner knitting kit" },
  { title: "Scented soy candle trio", emoji: "🕯️", priceUsd: 20, interests: ["candles", "decor", "relaxing"], searchQuery: "soy candle gift set" },
  { title: "Wireless earbuds", emoji: "🎧", priceUsd: 40, interests: ["music", "podcasts", "running", "gym"], searchQuery: "wireless earbuds" },
  { title: "Mini Bluetooth speaker", emoji: "🔊", priceUsd: 29, interests: ["music", "camping", "outdoors"], searchQuery: "mini bluetooth speaker portable" },
  { title: "Ukulele starter pack", emoji: "🎸", priceUsd: 45, interests: ["music", "guitar", "ukulele"], searchQuery: "ukulele beginner starter pack" },
  { title: "Gourmet hot sauce trio", emoji: "🌶️", priceUsd: 19, interests: ["cooking", "spicy food", "bbq"], searchQuery: "hot sauce gift set" },
  { title: "Silicone baking set", emoji: "🧁", priceUsd: 22, interests: ["baking", "cooking"], searchQuery: "silicone baking set" },
  { title: "Grill tool set", emoji: "🍖", priceUsd: 32, interests: ["bbq", "grilling", "cooking"], searchQuery: "bbq grill tool set" },
  { title: "Photo print frame set", emoji: "🖼️", priceUsd: 25, interests: ["photography", "decor", "art"], searchQuery: "picture frame set" },
  { title: "Phone tripod with remote", emoji: "📷", priceUsd: 21, interests: ["photography", "video", "travel"], searchQuery: "phone tripod with remote" },
  { title: "Travel packing cubes", emoji: "🧳", priceUsd: 23, interests: ["travel", "hiking", "camping"], searchQuery: "packing cubes travel set" },
  { title: "World map scratch-off poster", emoji: "🗺️", priceUsd: 17, interests: ["travel", "maps", "decor"], searchQuery: "scratch off world map poster" },
  { title: "Retro video game controller stand", emoji: "🎮", priceUsd: 18, interests: ["video games", "gaming", "games"], searchQuery: "game controller stand" },
  { title: "Cozy fleece blanket", emoji: "🛋️", priceUsd: 24, interests: ["relaxing", "movies", "tv", "reading"], searchQuery: "cozy fleece throw blanket" },
  { title: "Movie night popcorn kit", emoji: "🍿", priceUsd: 16, interests: ["movies", "tv", "snacks"], searchQuery: "movie night popcorn gift set" },
  { title: "Gourmet snack box", emoji: "🍫", priceUsd: 25, interests: ["snacks", "chocolate", "cooking"], searchQuery: "gourmet snack gift box" },
  { title: "Desk organizer set", emoji: "🗂️", priceUsd: 20, interests: ["organizing", "decor", "work"], searchQuery: "desk organizer set" },
];

export function amazonSearchUrl(searchQuery: string): string {
  return `https://www.amazon.com/s?k=${encodeURIComponent(searchQuery)}`;
}
