import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApplicantProfile, useSubmitApplication } from "@/hooks/use-applicant";

const counties = [
  "Bomet","Bungoma","Busia","Elgeyo Marakwet","Embu","Garissa","Homa Bay","Isiolo",
  "Kajiado","Kakamega","Kericho","Kiambu","Kilifi","Kirinyaga","Kisii","Kisumu",
  "Kitui","Kwale","Laikipia","Lamu","Machakos","Makueni","Mandera","Marsabit",
  "Meru","Migori","Mombasa","Murang'a","Nairobi","Nakuru","Nandi","Narok",
  "Nyamira","Nyandarua","Nyeri","Samburu","Siaya","Taita-Taveta","Tana River",
  "Tharaka Nithi","Trans Nzoia","Turkana","Uasin Gishu","Vihiga","Wajir","West Pokot"
];

const crops = ["Maize","Tea","Coffee","Sugarcane","Vegetables","Dairy","Beans","Rice","Wheat","Horticulture","Pyrethrum","Other"];
const purposes = ["Seeds & Fertilizer","Irrigation Setup","Equipment Purchase","Harvest & Storage","Land Preparation","Farm Labour","Veterinary & Livestock","Other"];

const schema = z.object({
  amountRequested: z.coerce.number().min(5000, "Minimum KES 5,000").max(500000, "Maximum KES 500,000"),
  purpose: z.string().min(1, "Select a purpose"),
  county: z.string().min(1, "Select your county"),
  farmSizeAcres: z.coerce.number().min(0.1, "Must be at least 0.1 acres"),
  cropType: z.string().min(1, "Select your primary crop"),
  monthlyIncome: z.coerce.number().min(0).optional(),
  existingDebt: z.coerce.number().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

export function Apply() {
  const [, setLocation] = useLocation();
  const [submitted, setSubmitted] = useState(false);
  const [newAppId, setNewAppId] = useState<number | null>(null);
  const { data: profile } = useApplicantProfile();
  const submitMutation = useSubmitApplication();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amountRequested: 20000,
      purpose: "",
      county: profile?.county ?? "",
      farmSizeAcres: profile?.farmSizeAcres ? Number(profile.farmSizeAcres) : 1,
      cropType: profile?.cropType ?? "",
      monthlyIncome: undefined,
      existingDebt: 0,
    },
  });

  const onSubmit = (values: FormValues) => {
    submitMutation.mutate(values, {
      onSuccess: (app) => {
        setNewAppId(app.id);
        setSubmitted(true);
      },
    });
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <Card className="text-center">
          <CardContent className="pt-10 pb-10 space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 text-green-600 rounded-full p-4">
                <CheckCircle className="h-8 w-8" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold">Application submitted</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Our 3 AI agents are reviewing your application now. This usually takes less than 2 minutes.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              {newAppId && (
                <Button onClick={() => setLocation(`/portal/applications/${newAppId}`)}>
                  Track my application
                </Button>
              )}
              <Link href="/portal">
                <Button variant="outline" className="w-full">Back to dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portal">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Apply for a Loan</h1>
        <p className="text-muted-foreground mt-1">
          3 AI agents will review your application and respond within minutes.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="amountRequested"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Requested (KES)</FormLabel>
                    <FormControl>
                      <Input type="number" step="1000" placeholder="20000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loan Purpose</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select purpose" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {purposes.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Farm Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="county"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>County</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {counties.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="farmSizeAcres"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Farm Size (Acres)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.1" min="0.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="cropType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Crop / Livestock</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select crop type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {crops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="monthlyIncome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Est. Monthly Income (KES)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="existingDebt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Existing Debt (KES)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            type="submit"
            className="w-full gap-2"
            size="lg"
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              <>Submit Application <ArrowRight className="h-4 w-4" /></>
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
