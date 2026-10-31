// Stable IDs link sections, groups and entities. Edit content here, independently of the UI.
// Missing personal facts stay null. Editorial placeholders are explicitly marked and hidden.
const entity = (id, type, fields) => ({
  id,
  type,
  title: "",
  subtitle: "",
  description: "",
  category: null,
  date: null,
  period: null,
  images: [],
  links: [],
  relatedIds: [],
  displayOrder: 0,
  visible: true,
  isPlaceholder: false,
  ...fields,
});
export const portfolioEntities = {
  "curiosity-quote": entity("curiosity-quote", "quote", {
    text: "I have no special talents. I am only passionately curious.",
    attribution: "Albert Einstein (1879–1955)",
  }),
  "interest-ai": entity("interest-ai", "topic", {
    title: "AI",
    displayOrder: 10,
  }),
  "interest-energy": entity("interest-energy", "topic", {
    title: "Energy",
    displayOrder: 20,
  }),
  "interest-economics-finance": entity("interest-economics-finance", "topic", {
    title: "Economics & Finance",
    displayOrder: 30,
  }),
  "interest-technology": entity("interest-technology", "topic", {
    title: "Technology",
    displayOrder: 40,
  }),
  "interest-entrepreneurship": entity("interest-entrepreneurship", "topic", {
    title: "Entrepreneurship",
    displayOrder: 50,
  }),
  "interest-engineering": entity("interest-engineering", "topic", {
    title: "Engineering",
    displayOrder: 60,
  }),
  "stealth-startup": entity("stealth-startup", "project", {
    title: "Startup",
    status: "Currently in stealth mode",
    relatedIds: ["interest-entrepreneurship"],
  }),
  "mechanical-engineering-eia": entity(
    "mechanical-engineering-eia",
    "education",
    {
      title: "Mechanical Engineer",
      subtitle: "Universidad EIA",
      period: "2022–2026",
      displayOrder: 10,
    },
  ),
  "finance-minor-eia": entity("finance-minor-eia", "education", {
    title: "Finance Minor",
    subtitle: "Universidad EIA",
    period: "2022–2026",
    displayOrder: 20,
    relatedIds: ["interest-economics-finance"],
  }),
  "contact-linkedin": entity("contact-linkedin", "contact", {
    title: "LinkedIn",
    links: [
      {
        id: "linkedin-profile",
        title: "Connect on LinkedIn",
        url: "https://www.linkedin.com/in/alvaro-javier-pardo-alvarez-a306b63b0/",
        newTab: true,
      },
    ],
  }),
  "hobby-gym": entity("hobby-gym", "topic", { title: "Gym", displayOrder: 10 }),
  "hobby-bike": entity("hobby-bike", "topic", {
    title: "Bike",
    displayOrder: 20,
  }),
  "hobby-running": entity("hobby-running", "topic", {
    title: "Running",
    displayOrder: 30,
  }),
  "hobby-learning": entity("hobby-learning", "topic", {
    title: "Learning",
    displayOrder: 40,
  }),
  "project-details-placeholder": entity(
    "project-details-placeholder",
    "project",
    {
      title: "[Placeholder: project details]",
      description: "[Not provided]",
      isPlaceholder: true,
      visible: false,
      displayOrder: 100,
    },
  ),
  "education-dates-placeholder": entity(
    "education-dates-placeholder",
    "education",
    {
      title: "[Placeholder: education dates]",
      description: "[Not provided]",
      isPlaceholder: true,
      visible: false,
      displayOrder: 100,
    },
  ),
};
const section = (id, objectId, fields) => ({
  id,
  objectId,
  title: "",
  subtitle: "",
  introduction: "",
  images: [],
  links: [],
  groups: [],
  relatedSectionIds: [],
  displayOrder: 0,
  visible: true,
  ...fields,
});
export const portfolioSections = [
  section("about-me", "f1", {
    title: "About Me",
    subtitle: "Driven by curiosity",
    displayOrder: 10,
    introduction:
      "I'm someone who enjoys understanding how things work, asking questions, and finding new ways to solve problems. I like challenging myself, learning through experience, and turning ideas into something real. I believe in staying curious, thinking differently, and constantly pushing myself to grow, both personally and professionally.",
    groups: [
      {
        id: "about-guiding-thought",
        title: "A guiding thought",
        layout: "stack",
        entityIds: ["curiosity-quote"],
        displayOrder: 10,
        visible: true,
      },
    ],
    relatedSectionIds: ["interests", "hobbies"],
  }),
  section("interests", "power-plant", {
    title: "Interests",
    subtitle: "Ideas worth exploring",
    displayOrder: 20,
    introduction: "The topics that spark my curiosity.",
    groups: [
      {
        id: "interest-topics",
        title: "What fascinates me",
        layout: "tiles",
        entityIds: [
          "interest-ai",
          "interest-energy",
          "interest-economics-finance",
          "interest-technology",
          "interest-entrepreneurship",
          "interest-engineering",
        ],
        displayOrder: 10,
        visible: true,
      },
    ],
    relatedSectionIds: ["projects", "education"],
  }),
  section("projects", "library", {
    title: "Projects",
    subtitle: "Turning ideas into something real",
    displayOrder: 30,
    introduction: "What I am building.",
    groups: [
      {
        id: "project-work",
        title: "Current work",
        layout: "stack",
        entityIds: ["stealth-startup", "project-details-placeholder"],
        displayOrder: 10,
        visible: true,
      },
    ],
    relatedSectionIds: ["interests", "contact"],
  }),
  section("education", "notebook", {
    title: "Education",
    subtitle: "My learning journey",
    displayOrder: 40,
    introduction: "My academic background.",
    groups: [
      {
        id: "education-background",
        title: "Education",
        layout: "stack",
        entityIds: [
          "mechanical-engineering-eia",
          "finance-minor-eia",
          "education-dates-placeholder",
        ],
        displayOrder: 10,
        visible: true,
      },
    ],
    relatedSectionIds: ["interests", "projects"],
  }),
  section("contact", "phone", {
    title: "Contact",
    subtitle: "Let’s connect",
    displayOrder: 50,
    introduction: "You can find me on LinkedIn.",
    groups: [
      {
        id: "contact-links",
        title: "Find me online",
        layout: "stack",
        entityIds: ["contact-linkedin"],
        displayOrder: 10,
        visible: true,
      },
    ],
    relatedSectionIds: ["about-me", "projects"],
  }),
  section("hobbies", "bike", {
    title: "Hobbies",
    subtitle: "Beyond work and study",
    displayOrder: 60,
    introduction: "Activities I enjoy outside my professional life.",
    groups: [
      {
        id: "hobby-activities",
        title: "Outside the everyday",
        layout: "route",
        entityIds: ["hobby-gym", "hobby-bike", "hobby-running", "hobby-learning"],
        displayOrder: 10,
        visible: true,
      },
    ],
    relatedSectionIds: ["about-me", "interests"],
  }),
];
export const panelCopy = {
  relatedHeading: "Keep exploring",
  visit: (title) => `Explore ${title}`,
  placeholderLabel: "Placeholder — details not provided",
  noteLabel: "A note for your learning journey",
  notePlaceholder: "An idea worth keeping…",
  notePrivacy: "Saved on this device only.",
  phoneAction: "Wake the screen ↗",
  phoneAwake: "You’re connected ✦",
};
export const guideCopy = {
  greeting:
    "Welcome! Explore About Me, Interests, Projects, Education, Contact or Hobbies. Which station would you like to visit?",
  fallback:
    "Ask me about About Me, Interests, Projects, Education, Contact or Hobbies, and I can lead you to a station.",
};
export const guideTopics = {
  "about-me": {
    aliases: [
      "about me",
      "who is alvaro",
      "personality",
      "curiosity",
      "f1",
      "car",
    ],
    summary:
      "Curiosity, learning through experience, and turning ideas into something real.",
  },
  interests: {
    aliases: [
      "interests",
      "ai",
      "artificial intelligence",
      "energy",
      "nuclear",
      "economics",
      "finance",
      "technology",
      "entrepreneurship",
      "engineering",
      "reactor",
      "power",
    ],
    summary:
      "AI, Energy, Economics & Finance, Technology, Entrepreneurship and Engineering.",
  },
  projects: {
    aliases: [
      "projects",
      "project",
      "startup",
      "start up",
      "stealth",
      "library",
      "book",
      "books",
    ],
    summary: "A startup currently in stealth mode.",
  },
  education: {
    aliases: [
      "education",
      "academic",
      "university",
      "mechanical engineering",
      "mechanical engineer",
      "finance minor",
      "eia",
      "notebook",
      "notes",
    ],
    summary: "Mechanical Engineer and Finance Minor at Universidad EIA, both from 2022 to 2026.",
  },
  contact: {
    aliases: ["contact", "linkedin", "connect", "phone", "smartphone"],
    summary: "Connect with me on LinkedIn.",
  },
  hobbies: {
    aliases: [
      "hobbies",
      "hobby",
      "gym",
      "bike",
      "bicycle",
      "cycling",
      "cycle",
      "running",
      "run",
      "learning",
      "learn",
    ],
    summary: "Gym, Bike, Running and Learning.",
  },
};
export function visibleInOrder(items) {
  return items
    .filter((item) => item.visible !== false)
    .toSorted((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}
export function getSection(id) {
  return portfolioSections.find((section) => section.id === id);
}
export function getSectionForObject(objectId) {
  return portfolioSections.find((section) => section.objectId === objectId);
}

// Clockwise physical order, matching the six landmark positions in the world.
export const stationSectionOrder = [
  "about-me", "interests", "projects", "education", "hobbies", "contact",
];
export function getStationNeighbors(sectionId, sections = portfolioSections) {
  const ring = stationSectionOrder
    .map((id) => sections.find((item) => item.id === id && item.visible !== false))
    .filter(Boolean);
  const index = ring.findIndex((item) => item.id === sectionId);
  if (index < 0 || ring.length < 2) return [];
  return [
    { section: ring[(index - 1 + ring.length) % ring.length], direction: "left" },
    { section: ring[(index + 1) % ring.length], direction: "right" },
  ];
}
