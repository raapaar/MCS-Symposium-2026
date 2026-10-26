import Announcements from "../components/Announcements";
import Documents from "../components/Documents";
import EventInfo from "../components/EventInfo";
import Gallery from "../components/Gallery";
import Presenters from "../components/Presenters";
import Schedule from "../components/Schedule";
import Sponsors from "../components/Sponsors";
import Staff from "../components/Staff";
import Store from "../v2/Store";
import Contact from "../v2/Contact";
import { ExperienceMap, LiveSpotlight } from "../v2/Frontier";

function Home() {
  return (
    <>
      {/*
       * Dynamic event experience:
       * - Hero banner
       * - Event date / venue
       * - Countdown
       * - About Symposium
       * - HOD welcome
       */}
      <EventInfo />
      <LiveSpotlight />
      <ExperienceMap />

      {/*
       * Presenters.tsx renders keynote speakers
       * separately from regular presenters.
       */}
      <Presenters />

      {/* Department Staff & Lecturers */}
      <Staff />

      {/* Symposium Schedule */}
      <Schedule />

      {/* Announcements */}
      <Announcements />

      {/* Sponsors & Partners */}
      <Sponsors />

      {/* Gallery */}
      <Store />
      <Gallery />

      {/* Documents */}
      <Documents />
      <Contact />
    </>
  );
}

export default Home;