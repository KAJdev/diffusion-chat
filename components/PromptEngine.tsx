export namespace PromptEngine {
  export const makePrompt = () => {
    const template = templates[Math.floor(Math.random() * templates.length)];
    let s = template
      .replace(/{noun}/g, nouns[Math.floor(Math.random() * nouns.length)])
      .replace(/{gerund}/g, gerunds[Math.floor(Math.random() * gerunds.length)])
      .replace(
        /{adjective}/g,
        adjectives[Math.floor(Math.random() * adjectives.length)]
      )
      .replace(/{adverb}/g, adverbs[Math.floor(Math.random() * adverbs.length)])
      .replace(
        /{artist}/g,
        artists[Math.floor(Math.random() * artists.length)]
      );

    for (let i = 0; i < Math.random() * 10; i++) {
      s += ", " + modifiers[Math.floor(Math.random() * modifiers.length)];
    }

    return s;
  };

  export const getModifers = () => {
    const modifierArray = [];
    for (let i = 0; i < 10; i++) {
      modifierArray.push(
        modifiers[Math.floor(Math.random() * modifiers.length)]
      );
    }
    return modifierArray.join(", ");
  };

  const templates = [
    "a {noun} {gerund} by {artist}",
    "{adjective} {noun} {gerund} by {artist}",
    "{adjective} {noun} {gerund} {adverb} by {artist}",
    "a {adjective} {noun} {gerund} {adverb} by {artist}",
  ];

  const nouns = [
    "dog",
    "cat",
    "bird",
    "fish",
    "person",
    "wizard",
    "witch",
    "dragon",
    "unicorn",
    "robot",
    "alien",
    "monster",
    "goblin",
    "elf",
    "dwarf",
    "orc",
    "troll",
    "giant",
    "golem",
    "demon",
    "angel",
    "ghost",
    "vampire",
    "werewolf",
    "zombie",
    "skeleton",
  ];

  const gerunds = [
    "running",
    "walking",
    "flying",
    "swimming",
    "singing",
    "dancing",
    "playing",
    "fighting",
    "hiding",
    "eating",
    "sleeping",
    "drinking",
    "smoking",
    "crying",
    "laughing",
    "screaming",
    "yelling",
    "reading",
    "writing",
    "drawing",
    "painting",
    "jumping",
    "hopping",
    "skipping",
  ];

  const adjectives = [
    "happy",
    "sad",
    "angry",
    "scared",
    "confused",
    "confident",
    "crazy",
    "silly",
    "funny",
    "weird",
    "strange",
    "odd",
    "boring",
    "exciting",
    "amazing",
    "beautiful",
    "ugly",
    "cute",
    "adorable",
    "handsome",
    "pretty",
    "smart",
    "dumb",
    "stupid",
    "clever",
    "brave",
    "shy",
    "quiet",
    "loud",
    "fast",
    "slow",
    "strong",
    "weak",
    "tall",
    "short",
    "fat",
    "skinny",
  ];

  const adverbs = [
    "quickly",
    "slowly",
    "happily",
    "sadly",
    "angrily",
    "scaredly",
    "confusedly",
    "confidently",
    "crazily",
    "sillyly",
    "funnily",
    "weirdly",
    "strangely",
    "oddly",
    "boringly",
    "excitingly",
    "amazingly",
    "beautifully",
    "cutely",
    "adorably",
    "handsomely",
    "prettyly",
    "smartly",
  ];

  const artists = [
    "A-1 Pictures",
    "Alvar Aalto",
    "Annie Leibovitz",
    "Antoni Gaudí",
    "Antonio Gaudí",
    "Antonio López García",
    "Ansel Adams",
    "Ansel Easton Adams",
    "Tyler Edlin",
    "Temmie Chang",
    "Terry Gilliam",
    "Terry Pratchett",
    "Terry Pratchett and Neil Gaiman",
    "Terry Pratchett and Stephen Baxter",
    "Ian Mcewan",
  ];

  const modifiers = [
    "acrylic painting",
    "trending on CGSociety",
    "trending on DeviantArt",
    "trending on ArtStation",
    "majestic",
    "epic",
    "legendary",
    "Maya",
    "8K",
    "4K",
    "wallpaper",
    "intricately detailed",
    "dramatic",
    "WLOP",
    "artgerm",
    "highly detailed",
    "by Greg Manchess",
    "by Antonio Moro",
    "Studio Ghibli",
    "Makoto Shinkai",
    "illustration",
    "digital painting",
    "concept art",
    "abstract art",
    "bloomcore",
    "rosepunk",
    "rosecore",
    "digital art",
    "digital painting",
    "digital illustration",
    "digital drawing",
    "digital sketch",
    "greg rutkowski",
    "masterpiece",
    "masterpiece by Greg Rutkowski",
    "fantasy",
    "fantasy art",
    "fantasy illustration",
    "fantasy painting",
    "fantasy drawing",
    "sharp focus",
    "Alphonse Mucha",
    "sharp",
    "Moebius",
    "Cyril Rolando",
    "Judy Chicago",
    "Blizzard",
    "elegant",
    "steampunk",
    "steampunk art",
    "steampunk illustration",
  ];
}
