"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Loader2 } from "lucide-react";

interface User {
  id: string;
  display_name: string;
  email: string;
  role: string;
  department?: string; // This might be the name currently
  department_id?: number; // You might need to add this to your User type
  region?: string;
}

interface Department {
  id: number;
  name: string;
}

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void; // Refresh list after update
  departments: Department[];
}

export default function EditUserModal({
  user,
  isOpen,
  onClose,
  onUpdate,
  departments,
}: EditUserModalProps) {
  const [role, setRole] = useState("");
  const [region, setRegion] = useState("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load user data into form when modal opens
  useEffect(() => {
    if (user) {
      setRole(user.role || "citizen");
      setRegion(user.region || "");
      // Assuming you can map the department name to an ID, or pass the ID in the user object
      // For now, let's try to match by name if ID is missing
      const foundDept = departments.find((d) => d.name === user.department);
      setDepartmentId(
        user.department_id?.toString() || foundDept?.id.toString() || "",
      );
    }
  }, [user, departments]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/users/${user.id}/attributes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          region,
          department_id: departmentId ? parseInt(departmentId) : null,
        }),
      });

      if (res.ok) {
        onUpdate();
        onClose();
      } else {
        console.error("Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Name</Label>
            <Input
              value={user?.display_name}
              disabled
              className="col-span-3 bg-muted"
            />
          </div>

          {/* ROLE SELECT */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="citizen">Citizen</SelectItem>
                <SelectItem value="official">Official</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DEPARTMENT SELECT (Only if Official/Admin) */}
          {(role === "official" || role === "admin") && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Dept.</Label>
              <Select value={departmentId} onValueChange={setDepartmentId}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Assign Department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* REGION INPUT (Only if Official) */}
          {role === "official" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Region</Label>
              <Input
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. North Zone, Ward 12"
                className="col-span-3"
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
