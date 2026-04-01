"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeartPulse, Calendar, Users, Building, Mail, Phone, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { submitHealthCampRequest } from "@/lib/actions/db-sync";

export default function RequestCampPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [minDate, setMinDate] = useState<string>("");

  useEffect(() => {
    // Generate the local YYYY-MM-DD date client-side
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setMinDate(localDate);
  }, []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const phone = formData.get("phone") as string;

    // Explicit manual validation of mobile number
    if (!phone || !phone.startsWith("+91") || phone.length !== 13) {
      setError("Mobile number must start with +91 followed by 10 digits (e.g. +911234567890).");
      setIsSubmitting(false);
      return;
    }

    const result = await submitHealthCampRequest(formData);

    if (result.success) {
      setIsSuccess(true);
    } else {
      setError(result.message);
    }
    setIsSubmitting(false);
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h2 className="text-3xl font-extrabold text-slate-900">Request Received!</h2>
          <p className="text-slate-600">Thank you for submitting your request. Our administrative team will review it and get back to your Point of Contact shortly.</p>
          <Link href="/">
            <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-8 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full max-w-4xl px-4 mb-8">
        <div className="flex justify-start">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </div>
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-emerald-100 rounded-2xl">
            <HeartPulse className="h-10 w-10 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Request a Health Camp
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 max-w">
          Fill out the details below to request a medical team visit for your school.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full max-w-4xl px-4">
        <Card className="border-t-4 border-t-emerald-600 shadow-xl shadow-emerald-900/5">
          <CardHeader>
          </CardHeader>
          <CardContent>
            {error && <div className="p-3 mb-4 text-sm text-red-700 bg-red-50 rounded-lg">{error}</div>}
            <form onSubmit={onSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {/* Left Column: School Information */}
                <div className="space-y-6">
                  <div className="space-y-2"><div>
                    <h3 className="text-sm font-semibold text-emerald-700 mb-4 uppercase tracking-wide">School Information </h3>
                  </div>
                    <Label htmlFor="schoolName" className="font-semibold text-slate-700">School Name</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input id="schoolName" name="schoolName" className="pl-10 h-11 bg-slate-50 border-slate-200" placeholder="e.g. Pathfinder Global School" required />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="date" className="font-semibold text-slate-700">Tentative Date</Label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input id="date" name="date" type="date" min={minDate} className="pl-10 h-11 bg-slate-50 border-slate-200" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="students" className="font-semibold text-slate-700">Estimated Students</Label>
                      <div className="relative">
                        <Users className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <Input id="students" name="students" type="number" min="10" className="pl-10 h-11 bg-slate-50 border-slate-200" placeholder="e.g. 500" required />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Point of Contact */}
                <div className="space-y-6 md:border-l md:border-slate-200 md:pl-10 border-t md:border-t-0 pt-8 md:pt-0 mt-8 md:mt-0">
                  <div>
                    <h3 className="text-sm font-semibold text-emerald-700 mb-1 uppercase tracking-wide">Point of Contact</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="pocName" className="font-semibold text-slate-700">Full Name</Label>
                      <Input id="pocName" name="pocName" className="h-11 bg-slate-50 border-slate-200" placeholder="e.g. Dinesh Kumar" required />
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-semibold text-slate-700">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input id="email" name="email" type="email" className="pl-10 h-11 bg-slate-50 border-slate-200" placeholder="pathfinder@gmail.com" required />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="font-semibold text-slate-700">Mobile Number</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            pattern="^\+91\d{10}$"
                            maxLength={13}
                            title="Mobile number must start with +91 followed by 10 digits"
                            className="pl-10 h-11 bg-slate-50 border-slate-200"
                            placeholder="e.g. +9112332xxxxx"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 flex justify-end">
                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto md:min-w-[200px] h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md transition-all hover:shadow-lg">
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Request"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div >
  );
}
