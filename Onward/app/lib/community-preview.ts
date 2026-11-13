import {
  COMMUNITY_SUBCATEGORIES,
  type Community,
  type CommunityTopic,
} from "@/lib/db";

type CommunityPreviewGroup = {
  [Topic in CommunityTopic]: {
    topic: Topic;
    communities: Array<{
      name: string;
      subcategory: (typeof COMMUNITY_SUBCATEGORIES)[Topic][number];
    }>;
  };
}[CommunityTopic];

const COMMUNITY_PREVIEW_GROUPS = [
  {
    topic: "Technology",
    communities: [
      { name: "Frontend Builders", subcategory: "Software Development" },
      { name: "AI Study Circle", subcategory: "AI & Machine Learning" },
      { name: "Data Explorers", subcategory: "Data & Analytics" },
      { name: "Cloud Native Crew", subcategory: "Software Development" },
      { name: "Design Systems Lab", subcategory: "Product & Design" },
      { name: "Open Source Makers", subcategory: "Software Development" },
      { name: "Mobile Dev Meetup", subcategory: "Software Development" },
      { name: "Robotics & IoT", subcategory: "Hardware & Robotics" },
      { name: "Cyber Safety Circle", subcategory: "General" },
      { name: "Indie Hackers", subcategory: "Product & Design" },
    ],
  },
  {
    topic: "Business",
    communities: [
      { name: "Startup Founders", subcategory: "Entrepreneurship" },
      { name: "Small Business Circle", subcategory: "Small Business" },
      { name: "Brand Builders", subcategory: "Marketing" },
      { name: "Product People", subcategory: "Entrepreneurship" },
      { name: "Freelancers Network", subcategory: "Careers" },
      { name: "Growth & Marketing", subcategory: "Marketing" },
      { name: "Women in Business", subcategory: "Entrepreneurship" },
      { name: "Finance for Creators", subcategory: "Finance & Investing" },
      { name: "E-commerce Operators", subcategory: "Small Business" },
      { name: "Career to Founder", subcategory: "Entrepreneurship" },
    ],
  },
  {
    topic: "Education & Career",
    communities: [
      { name: "Study Together", subcategory: "Study Groups" },
      { name: "Career Switchers", subcategory: "Job Search" },
      { name: "Job Search Support", subcategory: "Job Search" },
      { name: "Scholarship Hunters", subcategory: "Scholarships" },
      { name: "Academic Writing", subcategory: "Skills & Training" },
      { name: "Interview Practice", subcategory: "Job Search" },
      { name: "Early Career Circle", subcategory: "Mentorship" },
      { name: "Learning Spanish", subcategory: "Skills & Training" },
      { name: "Remote Work Skills", subcategory: "Skills & Training" },
      { name: "Graduate Mentors", subcategory: "Mentorship" },
    ],
  },
  {
    topic: "Wellness",
    communities: [
      { name: "Mindful Mornings", subcategory: "Mindfulness" },
      { name: "Walking Club", subcategory: "Fitness" },
      { name: "Healthy Habits", subcategory: "Healthy Habits" },
      { name: "Sleep Better Circle", subcategory: "Healthy Habits" },
      { name: "Stress Less", subcategory: "Mental Health" },
      { name: "Nutrition Notes", subcategory: "Nutrition" },
      { name: "Yoga at Home", subcategory: "Fitness" },
      { name: "Mental Wellness", subcategory: "Mental Health" },
      { name: "Fitness Beginners", subcategory: "Fitness" },
      { name: "Balance & Boundaries", subcategory: "Mental Health" },
    ],
  },
  {
    topic: "Arts & Design",
    communities: [
      { name: "Sketchbook Society", subcategory: "Visual Arts" },
      { name: "Graphic Design Circle", subcategory: "Visual Arts" },
      { name: "Creative Writers", subcategory: "Writing" },
      { name: "Photo Walks", subcategory: "Photography" },
      { name: "Illustrators Corner", subcategory: "Visual Arts" },
      { name: "DIY Makers", subcategory: "Crafts" },
      { name: "Motion Design", subcategory: "Visual Arts" },
      { name: "Music Makers", subcategory: "Music" },
      { name: "Interior Ideas", subcategory: "Visual Arts" },
      { name: "Craft & Crochet", subcategory: "Crafts" },
    ],
  },
] satisfies CommunityPreviewGroup[];

export function createPreviewCommunities(): Community[] {
  return COMMUNITY_PREVIEW_GROUPS.flatMap(({ topic, communities }, topicIndex) =>
    communities.map(({ name, subcategory }, index) => {
      const slug = `preview-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
      return {
        id: slug,
        slug,
        name,
        avatarPath: null,
        bannerPath: null,
        topic,
        subcategory,
        communityType: "public",
        isMature: false,
        description: `A friendly place to share ideas and progress in ${name.toLowerCase()}.`,
        createdAt: "2026-01-01T00:00:00.000Z",
        memberCount: 18 + topicIndex * 5 + index * 7,
        postCount: 2 + topicIndex + index * 3,
        isMember: false,
        isOwner: false,
      };
    }),
  );
}

export function isCommunityPreviewEnabled(search: string, hostname: string): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    (hostname === "localhost" || hostname === "127.0.0.1") &&
    new URLSearchParams(search).get("previewCommunities") === "1"
  );
}
