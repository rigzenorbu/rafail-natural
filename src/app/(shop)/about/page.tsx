import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our story",
  description:
    "The story of Rafail, a young entrepreneur from Ladakh who turned a challenge into a business built on natural, high-quality products.",
};

// Rafail's story, in his own words, told as a climb: each stop on the trail is one part of it.
const TRAIL = [
  {
    label: "The challenge",
    text: "Many people saw my physical disability as a limitation, but I chose to see it as a challenge to overcome. With determination and belief in myself, I started my own YouTube channel and stepped into the world of business at a young age.",
  },
  {
    label: "The work",
    text: "My business focuses on natural, high-quality products, from pure and healthy peanut butter to refreshing Multani Mitti (Fuller’s Earth) face masks. Every product reflects my commitment to quality, care, and customer satisfaction.",
  },
  {
    label: "The climb",
    text: "My journey has not always been easy, but every challenge has made me stronger, and every customer has motivated me to keep moving forward. As a young entrepreneur from Ladakh, I aspire to grow my business, explore new opportunities, and inspire others to believe in themselves.",
  },
];

export default function AboutPage() {
  return (
    <article className="story">
      <header className="story-hero">
        <div className="container story-hero-inner">
          <div className="hero-eyebrow">Our story · Ladakh</div>
          <h1>Hi, I am Rafail.</h1>
          <p className="story-lede">
            I am a young entrepreneur from the beautiful land of Ladakh, driven by a passion for learning, creating,
            and building something of my own.
          </p>
        </div>
        <svg className="story-ridge" viewBox="0 0 1200 120" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 120 L0 86 L90 62 L170 80 L265 38 L330 60 L420 22 L500 58 L585 40 L660 70 L760 14 L850 56 L930 36 L1010 72 L1100 48 L1200 78 L1200 120 Z" />
        </svg>
      </header>

      <section className="container story-body">
        <ol className="story-trail">
          {TRAIL.map((stop, i) => (
            <li key={stop.label} className="story-stop">
              <span className="story-marker" aria-hidden="true">{i + 1}</span>
              <h2>{stop.label}</h2>
              <p>{stop.text}</p>
            </li>
          ))}
        </ol>

        <figure className="story-quote">
          <svg viewBox="0 0 64 28" aria-hidden="true">
            <path d="M2 26 L20 8 L27 15 L38 2 L62 26" />
          </svg>
          <blockquote>
            I believe that our circumstances do not define us. With hard work, courage, and a clear purpose, we can turn
            our challenges into opportunities and our dreams into reality.
          </blockquote>
          <figcaption>Rafail, founder of Rafail Natural</figcaption>
        </figure>
      </section>

      <section className="section section-soft">
        <div className="container story-about">
          <div>
            <h2>What we bring you</h2>
            <p>
              Rafail Natural brings the produce of Ladakh, the high-altitude desert in the Himalayas, to homes across
              India. At over 3,500 metres, with clean air, glacier water and long sunny days, Ladakh grows fruits and
              herbs that are rich in flavour and nutrition.
            </p>
            <ul>
              <li><b>Seabuckthorn</b>: the &ldquo;wonder berry&rdquo; of the Himalayas, rich in vitamin C and omega oils.</li>
              <li><b>Apricots</b>: sun-dried Ladakhi apricots, kernels and apricot oil.</li>
              <li><b>Apples</b>: crisp mountain apples and homemade jams.</li>
              <li><b>Traditional foods &amp; teas</b>: roasted barley flour (tsampa), herbal teas and more.</li>
            </ul>
          </div>
          <div>
            <h2>Our promise</h2>
            <p>
              We buy directly from farmers and women&apos;s cooperatives in Ladakh, pack carefully, and ship all over
              India. Our products are natural, with no artificial colours or preservatives.
            </p>
            <p><Link href="/products" className="btn btn-primary btn-lg">Shop our products</Link></p>
          </div>
        </div>
      </section>
    </article>
  );
}
