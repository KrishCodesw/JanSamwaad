"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserCheck, MapPin, BarChart3, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Official = {
  id: string;
  name: string;
  region: string;
  workload: number;
};

interface DispatcherModalProps {
  issueId: number;
  departmentId: number;
  departmentName: string;
  onAssign: () => void; // Callback to refresh parent list
}

export default function DispatcherModal({
  issueId,
  departmentId,
  departmentName,
  onAssign,
}: DispatcherModalProps) {
  const [open, setOpen] = useState(false);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchOfficials();
    }
  }, [open]);

  const fetchOfficials = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/officials?departmentId=${departmentId}`,
      );
      if (res.ok) setOfficials(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (officialId: string) => {
    setAssigning(officialId);
    try {
      await fetch(`/api/admin/issues/${issueId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee_id: officialId }),
      });
      setOpen(false);
      onAssign(); // Refresh the dashboard
    } catch (error) {
      console.error("Assignment failed", error);
    } finally {
      setAssigning(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
        >
          <UserCheck className="h-3.5 w-3.5 mr-2" />
          Assign
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Issue #{issueId}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Select an official from <strong>{departmentName}</strong>
          </p>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-2 mt-2">
            {loading ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin" />
              </div>
            ) : officials.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No officials found in this department.
              </p>
            ) : (
              officials.map((official) => (
                <div
                  key={official.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
                  onClick={() => handleAssign(official.id)}
                >
                  <div className="space-y-1">
                    <p className="font-medium leading-none">{official.name}</p>
                    <div className="flex items-center text-xs text-muted-foreground gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {official.region}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div
                        className={`text-xs font-medium ${
                          official.workload > 5
                            ? "text-red-500"
                            : official.workload > 2
                              ? "text-yellow-500"
                              : "text-green-500"
                        }`}
                      >
                        {official.workload} Active
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Workload
                      </p>
                    </div>
                    <Button
                      size="sm"
                      disabled={!!assigning}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAssign(official.id);
                      }}
                    >
                      {assigning === official.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Select"
                      )}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
