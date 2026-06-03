import { Link } from "wouter";
import { Sprout, ArrowRight, CheckCircle, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: Zap, title: "Fast Decisions", desc: "3 AI agents review your application within minutes" },
  { icon: ShieldCheck, title: "Secure & Trusted", desc: "Your data is protected with bank-grade security" },
  { icon: CheckCircle, title: "Fair Assessment", desc: "Transparent scoring based on your farm and finances" },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 md:px-12 h-16 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground rounded-lg p-1.5">
            <Sprout className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">AgriPride Mkopo</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/officer">
            <Button variant="ghost" size="sm" className="text-muted-foreground text-xs">
              Loan Officer Portal
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button variant="outline" size="sm">Sign in</Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Apply now</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full border border-primary/20">
            <Sprout className="h-3 w-3" />
            Agricultural Credit for Kenyan Farmers
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground leading-tight">
            Grow your farm.<br />
            <span className="text-primary">Get the credit you deserve.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            AgriPride Mkopo provides fast, fair agricultural loans to smallholder farmers across Kenya.
            Apply online and get an AI-powered decision within minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                Apply for a Loan <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Sign in to my account
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mt-20">
          {features.map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-3 p-6 rounded-xl border bg-card text-center">
              <div className="bg-primary/10 text-primary rounded-lg p-2.5">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Loan range */}
        <div className="mt-16 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Loans from</p>
          <p className="text-4xl font-extrabold text-foreground">KES 5,000 – 500,000</p>
          <p className="text-sm text-muted-foreground">at competitive agricultural interest rates</p>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-muted-foreground border-t">
        AgriPride Mkopo v1.0 &mdash; Agricultural Loan Management
      </footer>
    </div>
  );
}
