// Guide videos shown in the footer, on /how-it-works, checkout and sign-up.
export const GUIDE_VIDEOS = {
  buy: {
    title: "How to buy a 3DM file",
    description: "Find a Rhino model, pay with USDT on BNB Smart Chain (BEP-20), paste the transaction hash and download your .3dm file.",
    src: "/videos/how-to-buy.mp4",
    poster: "/videos/how-to-buy-poster.jpg",
    duration: "PT1M23S",
  },
  sell: {
    title: "How to sell a 3DM file",
    description: "Get approved as a designer, upload your .3dm model, go live and get paid automatically in USDT.",
    src: "/videos/designer-welcome.mp4",
    poster: "/videos/designer-welcome-poster.jpg",
    duration: "PT1M35S",
  },
} as const;

export type GuideVideoKey = keyof typeof GUIDE_VIDEOS;
