import { apiFetch } from "@/lib/apiFetch";
import React, { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Receipt, CheckCircle2, IndianRupee, AlertCircle, Camera, FileText, X } from "lucide-react";
import { ButtonLoader } from "@/components/loading";

export interface DriverExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: number;
  onExpenseAdded: (newExpense: any) => void | Promise<void>;
}


// Categories that cover several distinct expenses. The driver picks the exact
// one; it is saved as "<Category> - <Option>" (e.g. "Fuel - CNG") so reports
// can show it individually.
const CATEGORY_OPTIONS: Record<string, string[]> = {
  Fuel: ["Petrol", "Diesel", "CNG"],
  Food: ["Driver Food", "Bata"],
  Maintenance: ["Puncture", "Repair"],
};

export const DriverExpenseModal: React.FC<DriverExpenseModalProps> = ({
  isOpen,
  onClose,
  tripId,
  onExpenseAdded,
}) => {
  const [category, setCategory] = useState("Fuel");
  const [subCategory, setSubCategory] = useState("");
  const [otherLabel, setOtherLabel] = useState("");
  const [amount, setAmount] = useState("500");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!amount || Number(amount) <= 0) return;
    if (CATEGORY_OPTIONS[category] && !subCategory) {
      setError(`Please select the exact ${category.toLowerCase()} type.`);
      return;
    }
    const finalCategory =
      CATEGORY_OPTIONS[category] ? `${category} - ${subCategory}`
      : category === "Other" && otherLabel.trim() ? `Other - ${otherLabel.trim()}`
      : category;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tripId,
          category: finalCategory,
          amount: Number(amount),
          notes,
          location,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || "Failed to submit expense.");
      }
      const newExpense = await res.json();
      await onExpenseAdded(newExpense);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Network error while submitting expense.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm bg-background text-foreground border-border p-5 rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-700 dark:text-amber-400" />
            Submit Operational Expense
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase block mb-1">Expense Category</label>
            <Select value={category} onValueChange={(v) => { setCategory(v); setSubCategory(""); }}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="Fuel">⛽ Fuel (Petrol / Diesel / CNG)</SelectItem>
                <SelectItem value="Toll">🛣️ Highway Toll</SelectItem>
                <SelectItem value="Parking">🅿️ Parking Fee</SelectItem>
                <SelectItem value="Food">🍽️ Driver Food / Bata</SelectItem>
                <SelectItem value="Accommodation">🏨 Overnight Stay</SelectItem>
                <SelectItem value="Permit">📄 Border State Permit</SelectItem>
                <SelectItem value="Maintenance">🔧 Puncture / Repair</SelectItem>
                <SelectItem value="Other">📦 Other Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {CATEGORY_OPTIONS[category] && (
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase block mb-1">
                {category} Type <span className="text-rose-600 dark:text-rose-400">*</span>
              </label>
              <Select value={subCategory} onValueChange={setSubCategory}>
                <SelectTrigger className="bg-card border-border">
                  <SelectValue placeholder={`Select ${category.toLowerCase()} type`} />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {CATEGORY_OPTIONS[category].map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {category === "Other" && (
            <div>
              <label className="text-xs text-muted-foreground font-semibold uppercase block mb-1">What was it for?</label>
              <Input
                value={otherLabel}
                onChange={(e) => setOtherLabel(e.target.value)}
                placeholder="e.g. Car wash"
                className="bg-card border-border text-xs"
              />
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase block mb-1">Amount (₹)</label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 1200"
              className="bg-card border-border text-lg font-mono font-bold text-emerald-700 dark:text-emerald-400 py-5"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase block mb-1">Pump / Location</label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. HPCL Petrol Pump, Nelamangala"
              className="bg-card border-border text-xs"
            />
          </div>

          <div>
            <label className="text-xs text-muted-foreground font-semibold uppercase block mb-1">Notes / Litres / Bill No.</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 12.5L Diesel with invoice #4902"
              className="bg-card border-border text-xs"
              rows={2}
            />
          </div>

          <p className="text-[11px] text-muted-foreground italic">
            * Note: Submitted expenses are marked as <strong>Pending</strong> until approved by the Operations Manager.
          </p>

          {error && (
            <div className="bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 rounded p-2.5 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-5 text-sm disabled:opacity-50"
          >
            {loading ? (
              <ButtonLoader label="Submitting..." />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> Submit for Approval
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
