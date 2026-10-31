import "../src/style.css";
import "../src/station-experiences.css";
import "../src/station-life.css";
import { landmarks, createPanelContent } from "../src/content.js";

for (const station of landmarks)
  document.querySelector("main").append(createPanelContent(station));
window.contentReview = true;
