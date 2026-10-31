import { landmarks } from "./content.js";
import {
  guideCopy,
  guideTopics,
  getSectionForObject,
} from "./portfolio-data.js";
const normalize = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
/** Replace only this function with your FastAPI client. The current guide is a local demo. */
export async function requestCompanionReply(messages) {
  const text = " " + normalize(messages.at(-1)?.content || "") + " ";
  const matches = landmarks
    .flatMap((item) => {
      const section = getSectionForObject(item.id),
        topic = guideTopics[section.id];
      return (topic?.aliases || [])
        .filter((alias) => text.includes(" " + normalize(alias) + " "))
        .map((alias) => ({
          item,
          section,
          topic,
          score: normalize(alias).length,
        }));
    })
    .sort((a, b) => b.score - a.score);
  const match = matches[0];
  return {
    message: match
      ? `Let’s visit ${match.item.title}. ${match.topic.summary} Follow me — I’ll show you the way!`
      : guideCopy.fallback,
    destination_object_id: match?.item.id || null,
  };
}
export function validateReply(reply) {
  if (!reply || typeof reply.message !== "string")
    throw new Error("The guide returned an invalid message.");
  return {
    message: reply.message,
    destination_object_id: landmarks.some(
      (item) => item.id === reply.destination_object_id,
    )
      ? reply.destination_object_id
      : null,
  };
}
