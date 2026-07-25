// import type { Metadata } from "next";
// import AboutHero from "@/app/components/AboutHero";

// export const metadata: Metadata = {
//   title: "About Us | 2212 - Mental Calisthenics",
//   description:
//     "Empowering young minds through Mental Calisthenics. Discover 2212's mission to make quality mental math training accessible to every student.",
// };

// export default function AboutPage() {
//   return (
//     <main>
//       <AboutHero />
//     </main>
//   );
// }

import type { Metadata } from "next";
import AboutHero from "@/app/components/AboutHero";
import AboutSections from "@/app/components/AboutSections"
export const metadata: Metadata = {
  title: "About Us | 2212 - Mental Calisthenics",
  description:
    "Empowering young minds through Mental Calisthenics. Discover 2212's mission to make quality mental math training accessible to every student.",
};

export default function AboutPage() {
  return (
    <main>
      <AboutHero />
      <AboutSections />
    </main>
  );
}