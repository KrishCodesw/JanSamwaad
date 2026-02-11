"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserX, Loader2 } from "lucide-react";

export default function UnassignButton({
  issueId,
  onUnassign,
}: {
  issueId: number;
  onUnassign: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleUnassign = async () => {
    if (!confirm("Are you sure you want to unassign this official?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/issues/${issueId}/assign`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignee_id: null }), // Send null to unassign
      });

      if (!res.ok) throw new Error("Failed to unassign");

      onUnassign(); // Refresh the list
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-6 w-6 text-muted-foreground hover:text-red-500 hover:bg-red-50"
      onClick={handleUnassign}
      disabled={loading}
      title="Unassign Official"
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <UserX className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
