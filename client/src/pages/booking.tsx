import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { GlassCard, CardContent, CardHeader, CardTitle } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { PRICING_CONFIG, calculatePrice } from "@shared/schema";
import type { Customer } from "@shared/schema";
import { Bed, Bath, Ruler, Tag, Percent, DollarSign, CalendarDays, Clock, CheckCircle2 } from "lucide-react";

export default function BookingPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [sqft, setSqft] = useState(1200);
  const [frequency, setFrequency] = useState("one-time");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split("T")[0];
  });
  const [arrivalWindow, setArrivalWindow] = useState("9:00 AM - 11:00 AM");

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/jobs", data);
      return res.json();
    },
    onSuccess: (job: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      toast({ title: "Booking confirmed", description: `Job #${job.id.slice(0, 8)} created successfully.` });
      navigate(`/jobs/${job.id}`);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);
  };

  const totalPrice = calculatePrice(bedrooms, bathrooms, sqft, frequency, selectedExtras);
  const subtotal = calculatePrice(bedrooms, bathrooms, sqft, "one-time", selectedExtras);
  const discount = PRICING_CONFIG.frequencyDiscounts[frequency] || 0;
  const discountAmount = subtotal * discount;

  const sqftRange = PRICING_CONFIG.sqftRanges.find((r) => sqft >= r.min && sqft <= r.max);

  const handleSubmit = () => {
    if (!customerId) {
      toast({ title: "Select a customer", description: "Please choose a customer for this booking.", variant: "destructive" });
      return;
    }
    createJobMutation.mutate({
      customerId,
      scheduledDate,
      arrivalWindow,
      bedrooms,
      bathrooms,
      sqft,
      frequency,
      extraIds: selectedExtras,
    });
  };

  const glassInput = "bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:ring-white/30";
  const glassSelect = "bg-white/10 border-white/20 text-white [&>span]:text-white";

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-lg" data-testid="text-page-title">New Booking</h1>
          <p className="text-sm text-white/70 mt-1">Create a new cleaning job with locked pricing.</p>
        </div>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white"><CalendarDays className="h-4 w-4" /> Customer & Schedule</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer" className="text-white">Customer</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger data-testid="select-customer" className={glassSelect}>
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-white">Scheduled Date</Label>
                <Input id="date" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} data-testid="input-date" className={glassInput} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="window" className="text-white">Arrival Window</Label>
                <Select value={arrivalWindow} onValueChange={setArrivalWindow}>
                  <SelectTrigger data-testid="select-arrival-window" className={glassSelect}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8:00 AM - 10:00 AM">8:00 AM - 10:00 AM</SelectItem>
                    <SelectItem value="9:00 AM - 11:00 AM">9:00 AM - 11:00 AM</SelectItem>
                    <SelectItem value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</SelectItem>
                    <SelectItem value="1:00 PM - 3:00 PM">1:00 PM - 3:00 PM</SelectItem>
                    <SelectItem value="2:00 PM - 4:00 PM">2:00 PM - 4:00 PM</SelectItem>
                    <SelectItem value="3:00 PM - 5:00 PM">3:00 PM - 5:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white"><Ruler className="h-4 w-4" /> Property Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-white"><Bed className="h-3.5 w-3.5" /> Bedrooms</Label>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => setBedrooms(Math.max(0, bedrooms - 1))} data-testid="button-bed-minus" className="border-white/20 text-white hover:bg-white/10">-</Button>
                  <span className="w-8 text-center font-medium text-white" data-testid="text-bedrooms">{bedrooms}</span>
                  <Button size="icon" variant="outline" onClick={() => setBedrooms(bedrooms + 1)} data-testid="button-bed-plus" className="border-white/20 text-white hover:bg-white/10">+</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-white"><Bath className="h-3.5 w-3.5" /> Bathrooms</Label>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="outline" onClick={() => setBathrooms(Math.max(0, bathrooms - 1))} data-testid="button-bath-minus" className="border-white/20 text-white hover:bg-white/10">-</Button>
                  <span className="w-8 text-center font-medium text-white" data-testid="text-bathrooms">{bathrooms}</span>
                  <Button size="icon" variant="outline" onClick={() => setBathrooms(bathrooms + 1)} data-testid="button-bath-plus" className="border-white/20 text-white hover:bg-white/10">+</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5 text-white"><Ruler className="h-3.5 w-3.5" /> Square Footage</Label>
                <Input type="number" value={sqft} onChange={(e) => setSqft(Number(e.target.value))} min={0} data-testid="input-sqft" className={glassInput} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-white"><Percent className="h-3.5 w-3.5" /> Cleaning Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger data-testid="select-frequency" className={glassSelect}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-Time Clean</SelectItem>
                  <SelectItem value="weekly">Weekly (20% off)</SelectItem>
                  <SelectItem value="biweekly">Bi-Weekly (10% off)</SelectItem>
                  <SelectItem value="monthly">Monthly (5% off)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </GlassCard>

        <GlassCard>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white"><Tag className="h-4 w-4" /> Add-On Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRICING_CONFIG.extras.map((extra) => (
                <label
                  key={extra.id}
                  className="flex items-center gap-3 p-3 rounded-md border border-white/20 cursor-pointer hover:bg-white/10 transition-all"
                  data-testid={`checkbox-extra-${extra.id}`}
                >
                  <Checkbox
                    checked={selectedExtras.includes(extra.id)}
                    onCheckedChange={() => toggleExtra(extra.id)}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-white">{extra.name}</span>
                  </div>
                  <span className="text-sm text-white/70">+${extra.price}</span>
                </label>
              ))}
            </div>
          </CardContent>
        </GlassCard>
      </div>

      <div className="w-full lg:w-80 lg:sticky lg:top-6 lg:self-start space-y-4">
        <GlassCard className="border-blue-400/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-white"><DollarSign className="h-4 w-4" /> Booking Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between" data-testid="text-summary-bedrooms">
                <span className="text-white/70">{bedrooms} Bedrooms</span>
                <span className="text-white">${bedrooms * PRICING_CONFIG.pricePerBedroom}</span>
              </div>
              <div className="flex justify-between" data-testid="text-summary-bathrooms">
                <span className="text-white/70">{bathrooms} Bathrooms</span>
                <span className="text-white">${bathrooms * PRICING_CONFIG.pricePerBathroom}</span>
              </div>
              <div className="flex justify-between" data-testid="text-summary-sqft">
                <span className="text-white/70">{sqft} sq ft</span>
                <span className="text-white">${sqftRange?.price || 210}</span>
              </div>
              {selectedExtras.map((id) => {
                const extra = PRICING_CONFIG.extras.find((e) => e.id === id);
                return extra ? (
                  <div className="flex justify-between" key={id}>
                    <span className="text-white/70">{extra.name}</span>
                    <span className="text-white">+${extra.price}</span>
                  </div>
                ) : null;
              })}
            </div>

            <div className="border-t border-white/20" />

            <div className="flex justify-between text-sm">
              <span className="text-white/70">Subtotal</span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-400" data-testid="text-discount">
                <span className="flex items-center gap-1"><Percent className="h-3 w-3" /> {frequency} discount ({(discount * 100).toFixed(0)}%)</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="border-t border-white/20" />

            <div className="flex justify-between items-baseline" data-testid="text-total-price">
              <span className="font-semibold text-white">Total</span>
              <span className="text-2xl font-bold text-white">${totalPrice.toFixed(2)}</span>
            </div>

            {frequency !== "one-time" && (
              <div className="text-xs text-white/50 text-center">
                per cleaning session
              </div>
            )}

            <Button
              className="w-full mt-2"
              onClick={handleSubmit}
              disabled={createJobMutation.isPending}
              data-testid="button-book-now"
            >
              {createJobMutation.isPending ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              {createJobMutation.isPending ? "Creating..." : "Book Now"}
            </Button>

            <p className="text-xs text-white/50 text-center mt-2">
              Price is locked at booking and will never change.
            </p>
          </CardContent>
        </GlassCard>
      </div>
    </div>
  );
}
