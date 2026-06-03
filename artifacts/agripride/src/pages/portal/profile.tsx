import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUser } from "@clerk/react";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApplicantProfile, useSaveProfile } from "@/hooks/use-applicant";
import { useToast } from "@/hooks/use-toast";

const counties = [
  "Bomet","Bungoma","Embu","Homa Bay","Kericho","Kiambu","Kisumu","Kitui",
  "Murang'a","Nakuru","Nandi","Narok","Nyeri","Uasin Gishu","Trans Nzoia","Other"
];
const crops = ["Maize","Tea","Coffee","Sugarcane","Vegetables","Dairy","Beans","Rice","Wheat","Horticulture","Other"];

const schema = z.object({
  name: z.string().min(2, "Full name required"),
  phone: z.string().min(10, "Valid phone number required"),
  nationalId: z.string().min(5, "National ID required"),
  county: z.string().min(1, "Select county"),
  farmSizeAcres: z.coerce.number().min(0.1, "Min 0.1 acres"),
  cropType: z.string().min(1, "Select crop"),
});

export function PortalProfile() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  const { data: profile } = useApplicantProfile();
  const saveMutation = useSaveProfile();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      nationalId: "",
      county: "",
      farmSizeAcres: 1,
      cropType: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name ?? user?.fullName ?? "",
        phone: profile.phone ?? "",
        nationalId: profile.nationalId ?? "",
        county: profile.county ?? "",
        farmSizeAcres: profile.farmSizeAcres ? Number(profile.farmSizeAcres) : 1,
        cropType: profile.cropType ?? "",
      });
    } else if (user) {
      form.setValue("name", user.fullName ?? "");
    }
  }, [profile, user]);

  const onSubmit = (values: z.infer<typeof schema>) => {
    saveMutation.mutate(values, {
      onSuccess: () => {
        toast({ title: "Profile saved" });
        setLocation("/portal");
      },
      onError: () => toast({ title: "Failed to save profile", variant: "destructive" }),
    });
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <Link href="/portal">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </Button>
        </Link>
      </div>
      <div>
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your farm details help AI agents give you an accurate assessment.
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Personal Information</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input placeholder="Grace Wanjiru Kamau" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input placeholder="+254712345678" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="nationalId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>National ID</FormLabel>
                    <FormControl><Input placeholder="12345678" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Farm Details</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <FormField control={form.control} name="county" render={({ field }) => (
                <FormItem>
                  <FormLabel>County</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select county" /></SelectTrigger></FormControl>
                    <SelectContent>{counties.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="farmSizeAcres" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Farm Size (Acres)</FormLabel>
                    <FormControl><Input type="number" step="0.1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="cropType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Crop</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger></FormControl>
                      <SelectContent>{crops.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </CardContent>
          </Card>
          <Button type="submit" className="w-full gap-2" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Profile
          </Button>
        </form>
      </Form>
    </div>
  );
}
