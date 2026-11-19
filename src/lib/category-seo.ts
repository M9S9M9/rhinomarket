// Search-friendly titles and introductions for the category pages.
// Keep the text factual: it describes what the category is for, not invented stats.

export interface CategorySeo {
  title: string;       // <title> and Google headline
  heading: string;     // H1 on the page
  description: string; // meta description (~155 characters)
  intro: string[];     // paragraphs shown on the page
}

const SEO: Record<string, CategorySeo> = {
  footwear: {
    title: "Rhino 3D Footwear Models (.3dm) – Shoes, Outsoles, Heels",
    heading: "Footwear 3D models for Rhino",
    description:
      "Download Rhino 3D (.3dm) footwear models: shoes, outsoles, heels, sandals and boots made by independent designers. Pay in USDT, download instantly.",
    intro: [
      "Rhino .3dm files for footwear design and development: complete shoes, outsoles with tread patterns, heels, midsoles, uppers, sandals and boots.",
      "Use them as a starting point for new collections, for sole and mold development, for client presentations or to learn how professional footwear surfaces are built in Rhino.",
    ],
  },
  jewelry: {
    title: "Rhino 3D Jewelry Models (.3dm) – Rings, Pendants, Bracelets",
    heading: "Jewelry 3D models for Rhino",
    description:
      "Download Rhino 3D (.3dm) jewelry models: rings, pendants, earrings, bracelets and settings by independent designers. Ready for rendering and production.",
    intro: [
      "Rhino .3dm files for jewelry design: engagement and fashion rings, pendants, earrings, bracelets, chains and stone settings.",
      "Adapt a model to your sizes and stones, prepare it for casting or 3D printing, or use it for product renders and catalogs.",
    ],
  },
  architect: {
    title: "Rhino 3D Architecture Models (.3dm) – Buildings & Facades",
    heading: "Architecture 3D models for Rhino",
    description:
      "Download Rhino 3D (.3dm) architecture models: buildings, facades, structures, pavilions and architectural details by independent designers.",
    intro: [
      "Rhino .3dm files for architecture and interior projects: buildings, facades, pavilions, structures, stairs and architectural details.",
      "Use them for concept studies, presentations, visualization and as reference for complex freeform geometry in Rhino.",
    ],
  },
  "human-artificial-limbs": {
    title: "Rhino 3D Prosthetics Models (.3dm) – Artificial Limbs & Orthotics",
    heading: "Prosthetics and orthotics 3D models for Rhino",
    description:
      "Download Rhino 3D (.3dm) models of prosthetics, artificial limbs, sockets and orthotic devices made by independent designers.",
    intro: [
      "Rhino .3dm files for prosthetic and orthotic design: artificial limbs, hands, sockets, covers, braces and orthotic devices.",
      "Use them as a base for custom devices, for research and education, or for 3D printing prototypes.",
    ],
  },
  "industrial-parts": {
    title: "Rhino 3D Industrial Parts Models (.3dm) – Machine Parts",
    heading: "Industrial parts 3D models for Rhino",
    description:
      "Download Rhino 3D (.3dm) industrial models: machine parts, mechanical components, enclosures and product design parts by independent designers.",
    intro: [
      "Rhino .3dm files for industrial and product design: machine parts, mechanical components, housings, enclosures and fixtures.",
      "Use them for product development, prototyping, manufacturing preparation or as a reference for precise modeling in Rhino.",
    ],
  },
  other: {
    title: "More Rhino 3D Models (.3dm)",
    heading: "More 3D models for Rhino",
    description:
      "Download more Rhino 3D (.3dm) models by independent designers: products, objects, furniture and designs that don't fit the other categories.",
    intro: [
      "Rhino .3dm files for everything else: products, everyday objects, furniture, art pieces and other designs.",
    ],
  },
};

export function categorySeo(slug: string, name: string, description?: string | null): CategorySeo {
  return (
    SEO[slug] ?? {
      title: `Rhino 3D ${name} Models (.3dm)`,
      heading: `${name} 3D models for Rhino`,
      description: `Download Rhino 3D (.3dm) ${name.toLowerCase()} models by independent designers on 3DM Store.`,
      intro: description ? [description] : [],
    }
  );
}
