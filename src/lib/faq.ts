// Frequently asked questions shown on /help.
// Answers may contain links written as [label](/path).
// Keep every answer true to how the site actually works.

export interface FaqItem {
  q: string;
  a: string;
}
export interface FaqSection {
  id: string;
  title: string;
  audience: "buyers" | "designers" | "everyone";
  items: FaqItem[];
}

export const FAQ: FaqSection[] = [
  {
    id: "buying",
    title: "Buying models",
    audience: "buyers",
    items: [
      {
        q: "What can I buy on 3DM Store?",
        a: "Rhino 3D (.3dm) models made by independent designers — footwear, jewelry, architecture, prosthetics, industrial parts and more. Every listing shows the Rhino version it was saved in, the file size and its license type.",
      },
      {
        q: "Do I need an account to buy?",
        a: "Yes. Creating an account is free and takes a minute: sign up with your Gmail address and enter the 6-digit code we email you. [Create an account](/auth/register).",
      },
      {
        q: "Can I see a model before buying?",
        a: "Each listing has preview images, a description and details such as file size and Rhino version. You can also read reviews from buyers who purchased it.",
      },
    ],
  },
  {
    id: "payments",
    title: "Payments (USDT)",
    audience: "buyers",
    items: [
      {
        q: "How do I pay?",
        a: "All payments are in USDT on BNB Smart Chain (BEP-20). Click Buy Now, and the checkout page shows the exact amount and our wallet address. Send exactly that amount of USDT on BNB Smart Chain from your wallet or exchange, then paste the transaction hash on the checkout page. Your payment is checked directly on the blockchain.",
      },
      {
        q: "Which network should I use?",
        a: "BNB Smart Chain (BEP-20) only. Do not send USDT on Tron (TRC-20), Ethereum (ERC-20) or any other network — payments sent on the wrong network cannot be recovered or refunded.",
      },
      {
        q: "How long does it take for my payment to be confirmed?",
        a: "Usually a few minutes. We check the blockchain automatically every couple of minutes. If a payment can't be matched automatically, our team reviews it and you'll get a notification when your download is ready.",
      },
      {
        q: "I sent the wrong amount. What happens?",
        a: "Open a [support ticket](/dashboard/support) with your transaction hash and we will refund you. Please double-check the amount and network before sending to avoid delays.",
      },
    ],
  },
  {
    id: "downloads",
    title: "Downloads, licenses & refunds",
    audience: "buyers",
    items: [
      {
        q: "Where do I find my file after paying?",
        a: "In [My Purchases](/dashboard/purchases) on your dashboard, as soon as your payment is confirmed. You can download your purchased files again at any time.",
      },
      {
        q: "What's the difference between Personal, Commercial and Exclusive licenses?",
        a: "Personal: for personal, non-commercial projects. Commercial: also lets you use the model in commercial products, client projects and marketing. Exclusive: the design is yours alone and the model is removed from the marketplace. None of them allow reselling or sharing the original file. Full details: [License Types](/licenses).",
      },
      {
        q: "Can I get a refund?",
        a: "If a file is corrupted or significantly different from its description, you can request a refund within 14 days of purchase. If you sent the wrong payment amount, we refund it. Payments sent on the wrong network cannot be refunded. To request a refund, open a [support ticket](/dashboard/support).",
      },
    ],
  },
  {
    id: "selling",
    title: "Selling your models",
    audience: "designers",
    items: [
      {
        q: "How do I start selling?",
        a: "Create a free account, then apply to become a designer from your [dashboard](/dashboard). Add your USDT (BEP-20) wallet address in the application. Our team reviews every application before approval.",
      },
      {
        q: "How much does it cost to sell?",
        a: "Listing is free. 3DM Store takes a commission on each sale — 15% by default. The rate can change depending on your sales. The commission taken from every sale is shown on your [Earnings](/dashboard/designer/earnings) page. 3DM Store pays the network fees for sending your payouts, so they are never deducted from your earnings.",
      },
      {
        q: "Is there a minimum price?",
        a: "No. You set your own prices, with no minimum.",
      },
      {
        q: "How many models can I list?",
        a: "Each designer account has a listing limit, shown on your designer dashboard. If you need more, open a [support ticket](/dashboard/support).",
      },
      {
        q: "Do I keep the rights to my models?",
        a: "Yes. You keep full ownership of your work. Buyers receive a license to use the model according to the license type of the listing. See the [Designer Agreement](/designer-agreement).",
      },
      {
        q: "How are my models protected?",
        a: "Model files are stored privately and only released to buyers after their payment is confirmed. Every download is tagged to its buyer, and uploads that copy an existing listing or a purchased file are rejected automatically.",
      },
      {
        q: "Someone copied my model. What can I do?",
        a: "Use the \"Report this Model\" button on the copied listing, or see our [DMCA policy](/dmca). Our team reviews every report.",
      },
    ],
  },
  {
    id: "payouts",
    title: "Getting paid",
    audience: "designers",
    items: [
      {
        q: "How and when do I get paid?",
        a: "Automatically. Once a buyer's payment is confirmed on the blockchain, your share is sent in USDT (BEP-20) to your payout wallet.",
      },
      {
        q: "How do I change my payout wallet?",
        a: "Go to [Earnings](/dashboard/designer/earnings), click Update next to your wallet and enter the new address. For your security we email you a code to confirm the change, send you a notice afterwards, and pause automatic payouts for 24 hours.",
      },
    ],
  },
  {
    id: "account",
    title: "Account & security",
    audience: "everyone",
    items: [
      {
        q: "I didn't receive my verification code.",
        a: "Check your Spam and Promotions folders. Codes expire after 10 minutes, and you can request a new one once a minute from the sign-up or verification page.",
      },
      {
        q: "I forgot my password.",
        a: "Use [Forgot password](/auth/forgot-password) on the sign-in page and we'll email you a link to set a new one.",
      },
    ],
  },
  {
    id: "support",
    title: "Support",
    audience: "everyone",
    items: [
      {
        q: "How do I contact support?",
        a: "Through support tickets only: sign in and go to [Support](/dashboard/support) on your dashboard. Include your order or transaction hash if your question is about a payment.",
      },
    ],
  },
];
