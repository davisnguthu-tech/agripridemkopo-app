import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Sprout, ArrowLeft, Globe, Leaf, Brain, CreditCard, Phone, CheckCircle } from "lucide-react";

const content = {
  en: {
    langLabel: "Swahili",
    back: "Back",
    badge: "About Us",
    title: "Empowering Kenyan Farmers with Smart Credit",
    intro: "AgriPride Mkopo is a digital agricultural lending platform built to help smallholder farmers across Kenya access affordable credit — quickly, fairly, and without the usual paperwork.",
    servicesTitle: "Our Services",
    services: [
      {
        icon: CreditCard,
        title: "Agricultural Loans",
        desc: "Borrow between KES 5,000 and KES 500,000 for seeds, fertilizers, irrigation, equipment, farm labour, harvest & storage, and livestock.",
      },
      {
        icon: Brain,
        title: "AI-Powered Loan Review",
        desc: "Three specialised AI agents — a Credit Risk Assessor, an Agricultural Analyst, and a Final Decision Authority — review every application within minutes. Decisions are transparent, fair, and explained in plain language.",
      },
      {
        icon: Leaf,
        title: "Financial Coaching",
        desc: "Our AI Financial Coach answers questions about loans, repayment strategies, budgeting for farm inputs, and how to improve your credit score over time.",
      },
      {
        icon: Phone,
        title: "USSD Access",
        desc: "No smartphone? No problem. Dial our USSD code to check your loan status or make repayments from any mobile phone.",
      },
    ],
    howTitle: "How It Works",
    steps: [
      "Create a free account using your email or Google sign-in.",
      "Fill in your farm details and the amount you need.",
      "Three AI agents review your application within minutes.",
      "If approved, funds are disbursed to your M-Pesa. If not, you receive a clear reason and tips to improve.",
    ],
    contactTitle: "Contact Us",
    contactLines: ["Email: support@agripridemkopo.co.ke", "Phone / WhatsApp: +254 700 000 000", "USSD: *384*5678#"],
    applyNow: "Apply for a Loan",
  },
  sw: {
    langLabel: "English",
    back: "Rudi",
    badge: "Kuhusu Sisi",
    title: "Kuwezesha Wakulima wa Kenya na Mikopo ya Kisasa",
    intro: "AgriPride Mkopo ni jukwaa la kidijitali la mikopo ya kilimo lililoundwa kusaidia wakulima wadogo kote Kenya kupata mkopo wa bei nafuu — haraka, kwa usawa, na bila karatasi nyingi.",
    servicesTitle: "Huduma Zetu",
    services: [
      {
        icon: CreditCard,
        title: "Mikopo ya Kilimo",
        desc: "Kopa kati ya KES 5,000 na KES 500,000 kwa mbegu, mbolea, umwagiliaji, vifaa, kazi ya shambani, mavuno na uhifadhi, na mifugo.",
      },
      {
        icon: Brain,
        title: "Ukaguzi wa Mkopo kwa AI",
        desc: "Mawakala watatu maalum wa AI — Mkaguzi wa Hatari ya Mkopo, Mchambuzi wa Kilimo, na Mamlaka ya Uamuzi wa Mwisho — wanakagua ombi lako ndani ya dakika chache. Maamuzi ni wazi, ya haki, na yanaelezwa kwa lugha rahisi.",
      },
      {
        icon: Leaf,
        title: "Ushauri wa Fedha",
        desc: "Mshauri wetu wa Fedha wa AI anajibu maswali kuhusu mikopo, mikakati ya kulipa deni, upanga wa bajeti kwa pembejeo za shamba, na jinsi ya kuboresha alama yako ya mkopo.",
      },
      {
        icon: Phone,
        title: "Huduma ya USSD",
        desc: "Huna simu ya kisasa? Hakuna shida. Piga nambari yetu ya USSD kuangalia hali ya mkopo wako au kulipa kutoka kwa simu yoyote.",
      },
    ],
    howTitle: "Jinsi Inavyofanya Kazi",
    steps: [
      "Fungua akaunti ya bure ukitumia barua pepe yako au kuingia kwa Google.",
      "Jaza maelezo ya shamba lako na kiasi unachohitaji.",
      "Mawakala watatu wa AI wanakagua ombi lako ndani ya dakika chache.",
      "Ukipitishwa, fedha zinatumwa kwa M-Pesa yako. Ikiwa la, utapokea sababu wazi na vidokezo vya kuboresha.",
    ],
    contactTitle: "Wasiliana Nasi",
    contactLines: ["Barua pepe: support@agripridemkopo.co.ke", "Simu / WhatsApp: +254 700 000 000", "USSD: *384*5678#"],
    applyNow: "Omba Mkopo",
  },
};

type Lang = "en" | "sw";

export function About() {
  const [lang, setLang] = useState<Lang>("en");
  const t = content[lang];

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> {t.back}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground rounded-lg p-1.5">
              <Sprout className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm tracking-tight hidden sm:block">AgriPride Mkopo</span>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => setLang(lang === "en" ? "sw" : "en")}
        >
          <Globe className="h-4 w-4" />
          {t.langLabel}
        </Button>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 space-y-12">
        {/* Hero */}
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/20">
            <Sprout className="h-3 w-3" /> {t.badge}
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground leading-tight">
            {t.title}
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">{t.intro}</p>
        </div>

        {/* Services */}
        <div>
          <h2 className="text-xl font-bold mb-5">{t.servicesTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {t.services.map((s) => (
              <Card key={s.title} className="border bg-card">
                <CardContent className="pt-5 pb-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 text-primary rounded-lg p-2">
                      <s.icon className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm">{s.title}</span>
                  </div>
                  <p className="text-muted-foreground text-sm leading-relaxed">{s.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div>
          <h2 className="text-xl font-bold mb-5">{t.howTitle}</h2>
          <ol className="space-y-3">
            {t.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                  {i + 1}
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Contact */}
        <Card className="border bg-card">
          <CardContent className="pt-5 pb-5 space-y-3">
            <h2 className="font-bold">{t.contactTitle}</h2>
            {t.contactLines.map((l) => (
              <div key={l} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                {l}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center pb-6">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              {t.applyNow} <Sprout className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
