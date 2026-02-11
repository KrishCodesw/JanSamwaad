"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Mail } from "lucide-react";
// import { useToast } from "@/hooks/use-toast";

// Hardcoded for now, but you should fetch these from your 'departments' table
const DEPARTMENTS = [
  { id: 1, name: "Roads & Infrastructure" },
  { id: 2, name: "Water Supply" },
  { id: 3, name: "Sanitation" },
  { id: 4, name: "Parks & Recreation" },
  { id: 5, name: "Electricity" },
];

export default function AddOfficialModal({
  onOfficialAdded,
}: {
  onOfficialAdded?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  //   const { toast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    departmentId: "",
    region: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to invite official");

      //   toast({
      //     title: "Invitation Sent",
      //     description: `An invite email has been sent to ${formData.email}`,
      //   });

      setOpen(false);
      setFormData({ email: "", fullName: "", departmentId: "", region: "" }); // Reset form
      if (onOfficialAdded) onOfficialAdded(); // Refresh parent list
    } catch (error: any) {
      //   toast({
      //     title: "Error",
      //     description: error.message,
      //     variant: "destructive",
      //   });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-white-600 hover:bg-white-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Add Official {"(Coming soon...)"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite New Official</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="official@gov.in"
                className="pl-9"
                required
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <p className="text-xs text-muted-foreground">
              They will receive a magic link to set their password.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="e.g. Rajesh Verma"
              required
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select
                value={formData.departmentId}
                onValueChange={(val) =>
                  setFormData({ ...formData, departmentId: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Dept" />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Assigned Region</Label>
              <Input
                id="region"
                placeholder="e.g. Andheri East"
                value={formData.region}
                onChange={(e) =>
                  setFormData({ ...formData, region: e.target.value })
                }
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              "Send Invitation"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
