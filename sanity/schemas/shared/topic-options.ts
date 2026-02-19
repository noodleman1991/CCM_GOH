export const topicOptions = [
    { title: "Climate Change & Environment", value: "climate-environment" },
    { title: "Mental Health & Wellbeing", value: "mental-health" },
    { title: "Community Health & Social Care", value: "community-health" },
    { title: "Youth Engagement & Education", value: "youth-education" },
    { title: "Policy Research & Governance", value: "policy-governance" },
    { title: "Technology & Innovation", value: "technology-innovation" },
    { title: "Economic Development", value: "economic-development" },
    { title: "Cultural Heritage & Arts", value: "cultural-arts" },
    { title: "Food Security & Agriculture", value: "food-agriculture" },
    { title: "Urban Planning & Infrastructure", value: "urban-planning" },
    { title: "Human Rights & Social Justice", value: "human-rights" },
    { title: "Migration & Displacement", value: "migration" },
    { title: "Gender Equality", value: "gender-equality" },
    { title: "Disaster Risk & Resilience", value: "disaster-resilience" },
    { title: "Digital Inclusion", value: "digital-inclusion" },
    { title: "Other", value: "other" },
] as const;

export type TopicValue = (typeof topicOptions)[number]["value"];
