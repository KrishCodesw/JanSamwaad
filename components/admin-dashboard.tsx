"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Flag,
  MessageSquare,
  Settings,
  FileText,
  Plus,
  Megaphone,
  UserCheck,
  Building,
  CheckSquare,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  MoreHorizontal,
  Shield,
  AlertCircle,
} from "lucide-react";

type AdminStats = {
  total_issues: number;
  active_issues: number;
  in_progress_issues: number;
  under_review_issues: number;
  closed_issues: number;
  flagged_issues: number;
  total_votes: number;
  issues_by_category: Record<string, number>;
  issues_by_status: Record<string, number>;
  recent_issues_trend: { date: string; count: number }[];
};

type Issue = {
  id: number;
  description: string;
  status: string;
  tags: string[];
  flagged: boolean;
  created_at: string;
  reporter_email: string;
  vote_count?: { count: number }[] | null;
  images: { url: string }[];
  assignment?: {
    department: { name: string };
    assignee: { display_name: string };
    notes: string;
  };
};

type User = {
  id: string;
  display_name: string;
  role: string;
  department_id: number | null;
  created_at: string;
  issues_count: number;
  votes_count: number;
  announcements_count: number;
};

type Department = {
  id: number;
  name: string;
  description?: string;
  issues_count: number;
  officials_count: number;
  regions_count: number;
  assignments_count: number;
};

const STATUS_COLORS = {
  active: "#ef4444",
  under_progress: "#f59e0b",
  under_review: "#3b82f6",
  closed: "#10b981",
};

const PRIORITY_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#f97316",
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "under_progress", label: "In Progress" },
  { value: "under_review", label: "Under Review" },
  { value: "closed", label: "Closed" },
];

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  { value: "pothole", label: "Pothole" },
  { value: "streetlight", label: "Street Light" },
  { value: "sanitation", label: "Sanitation" },
  { value: "water", label: "Water Issue" },
  { value: "traffic", label: "Traffic Signal" },
  { value: "park", label: "Parks & Recreation" },
  { value: "other", label: "Other" },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "issues" | "announcements" | "users" | "departments"
  >("overview");

  // New state for users and departments
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(false);

  // Bulk operations
  const [selectedIssues, setSelectedIssues] = useState<Set<number>>(new Set());
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  // User management
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  // Department management
  const [selectedDepartment, setSelectedDepartment] =
    useState<Department | null>(null);
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    description: "",
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Issue management
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  // Announcements
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    content: "",
    type: "general",
    priority: "normal",
  });

  useEffect(() => {
    fetchStats();
    fetchIssues();
    fetchAnnouncements();
    if (activeTab === "users") {
      fetchUsers();
    }
    if (activeTab === "departments") {
      fetchDepartments();
    }
  }, [statusFilter, categoryFilter, activeTab, userRoleFilter]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchIssues = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (categoryFilter !== "all") params.set("category", categoryFilter);

      const res = await fetch(`/api/admin/issues?${params}`);
      if (res.ok) {
        const data = await res.json();
        setIssues(data);
      }
    } catch (error) {
      console.error("Error fetching issues:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const updateIssueStatus = async (
    issueId: number,
    newStatus: string,
    notes?: string
  ) => {
    setStatusUpdateLoading(true);
    try {
      const res = await fetch(`/api/admin/issues/${issueId}/status`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus, notes }),
      });

      if (res.ok) {
        await fetchIssues();
        await fetchStats();
        setSelectedIssue(null);
      }
    } catch (error) {
      console.error("Error updating issue status:", error);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const createAnnouncement = async () => {
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(announcementForm),
      });

      if (res.ok) {
        setAnnouncementForm({
          title: "",
          content: "",
          type: "general",
          priority: "normal",
        });
        setShowAnnouncementForm(false);
        await fetchAnnouncements();
      }
    } catch (error) {
      console.error("Error creating announcement:", error);
    }
  };

  // New fetch functions
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams();
      if (userRoleFilter !== "all") params.set("role", userRoleFilter);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchDepartments = async () => {
    setDepartmentsLoading(true);
    try {
      const res = await fetch("/api/admin/departments");
      if (res.ok) {
        const data = await res.json();
        setDepartments(data || []);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ user_id: userId, role: newRole }),
      });

      if (res.ok) {
        await fetchUsers();
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const createDepartment = async () => {
    try {
      const res = await fetch("/api/admin/departments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(departmentForm),
      });

      if (res.ok) {
        setDepartmentForm({ name: "", description: "" });
        setShowDepartmentForm(false);
        await fetchDepartments();
      }
    } catch (error) {
      console.error("Error creating department:", error);
    }
  };

  const performBulkOperation = async (operation: string, data: any) => {
    if (selectedIssues.size === 0) return;

    setBulkOperationLoading(true);
    try {
      const res = await fetch("/api/admin/issues/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          operation,
          issue_ids: Array.from(selectedIssues),
          data,
        }),
      });

      if (res.ok) {
        await fetchIssues();
        await fetchStats();
        setSelectedIssues(new Set());
      }
    } catch (error) {
      console.error("Error performing bulk operation:", error);
    } finally {
      setBulkOperationLoading(false);
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  const categoryData = stats?.issues_by_category
    ? Object.entries(stats.issues_by_category).map(([category, count]) => ({
        name: category,
        value: count,
      }))
    : [];

  const statusData = stats?.issues_by_status
    ? Object.entries(stats.issues_by_status).map(([status, count]) => ({
        name: status.replace("_", " "),
        value: count,
        fill: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "#6b7280",
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Government Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage civic issues and government announcements
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant={activeTab === "overview" ? "default" : "outline"}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === "issues" ? "default" : "outline"}
            onClick={() => setActiveTab("issues")}
          >
            Issues Management
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </Button>
          <Button
            variant={activeTab === "departments" ? "default" : "outline"}
            onClick={() => setActiveTab("departments")}
          >
            <Building className="h-4 w-4 mr-2" />
            Departments
          </Button>
          <Button
            variant={activeTab === "announcements" ? "default" : "outline"}
            onClick={() => setActiveTab("announcements")}
          >
            Announcements
          </Button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && stats && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Issues
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_issues}</div>
                <p className="text-xs text-muted-foreground">All time</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Issues
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.active_issues}
                </div>
                <p className="text-xs text-muted-foreground">Needs attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  In Progress
                </CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.in_progress_issues}
                </div>
                <p className="text-xs text-muted-foreground">Being worked on</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Flagged Priority
                </CardTitle>
                <Flag className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {stats.flagged_issues}
                </div>
                <p className="text-xs text-muted-foreground">High priority</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Issues by Status</CardTitle>
                <CardDescription>
                  Distribution of current issue statuses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Issues by Category</CardTitle>
                <CardDescription>
                  Most common types of reported issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Trend Chart */}
          {stats.recent_issues_trend &&
            stats.recent_issues_trend.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Issues Trend (Last 30 Days)</CardTitle>
                  <CardDescription>
                    Daily issue reporting activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={stats.recent_issues_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
        </div>
      )}

      {/* Issues Management Tab */}
      {activeTab === "issues" && (
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filter Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Operations */}
          {selectedIssues.size > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Bulk Operations ({selectedIssues.size} selected)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    onClick={() =>
                      performBulkOperation("update_status", {
                        status: "under_progress",
                      })
                    }
                    disabled={bulkOperationLoading}
                    size="sm"
                  >
                    Mark as In Progress
                  </Button>
                  <Button
                    onClick={() =>
                      performBulkOperation("update_status", {
                        status: "closed",
                      })
                    }
                    disabled={bulkOperationLoading}
                    size="sm"
                  >
                    Close Issues
                  </Button>
                  <Button
                    onClick={() =>
                      performBulkOperation("flag_priority", { flagged: true })
                    }
                    disabled={bulkOperationLoading}
                    size="sm"
                    variant="outline"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Flag Priority
                  </Button>
                  <Button
                    onClick={() => setSelectedIssues(new Set())}
                    disabled={bulkOperationLoading}
                    size="sm"
                    variant="outline"
                  >
                    Clear Selection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Issues List */}
          <div className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">
                    Loading issues...
                  </p>
                </CardContent>
              </Card>
            ) : issues.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">
                    No issues found matching the current filters.
                  </p>
                </CardContent>
              </Card>
            ) : (
              issues.map((issue) => (
                <Card
                  key={issue.id}
                  className={issue.flagged ? "border-red-200" : ""}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedIssues.has(issue.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedIssues);
                            if (e.target.checked) {
                              newSelected.add(issue.id);
                            } else {
                              newSelected.delete(issue.id);
                            }
                            setSelectedIssues(newSelected);
                          }}
                          className="mt-1"
                        />
                        <div className="space-y-1">
                          <CardTitle className="text-base">
                            Issue #{issue.id}
                            {issue.flagged && (
                              <Flag className="inline ml-2 h-4 w-4 text-red-500" />
                            )}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge
                              variant="secondary"
                              className={
                                issue.status === "active"
                                  ? "bg-red-100 text-red-800"
                                  : issue.status === "under_progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : issue.status === "under_review"
                                  ? "bg-blue-100 text-blue-800"
                                  : "bg-green-100 text-green-800"
                              }
                            >
                              {issue.status.replace("_", " ")}
                            </Badge>
                            {issue.tags.map((tag) => (
                              <Badge key={tag} variant="outline">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-sm text-muted-foreground">
                        <div>{issue.vote_count?.[0]?.count || 0} votes</div>
                        <div>
                          {new Date(issue.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm mb-3">{issue.description}</p>

                    {issue.assignment && (
                      <div className="text-xs text-muted-foreground mb-3">
                        <strong>Assigned to:</strong>{" "}
                        {issue.assignment.department.name}
                        {issue.assignment.assignee &&
                          ` (${issue.assignment.assignee.display_name})`}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Select
                        value={issue.status}
                        onValueChange={(newStatus) =>
                          updateIssueStatus(issue.id, newStatus)
                        }
                        disabled={statusUpdateLoading}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="under_progress">
                            Under Progress
                          </SelectItem>
                          <SelectItem value="under_review">
                            Under Review
                          </SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIssue(issue)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Announcements Tab */}
      {activeTab === "announcements" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Government Announcements</CardTitle>
                <CardDescription>
                  Manage public announcements and notifications
                </CardDescription>
              </div>
              <Button onClick={() => setShowAnnouncementForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Announcement
              </Button>
            </CardHeader>
          </Card>

          {/* Announcement Form */}
          {showAnnouncementForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Announcement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={announcementForm.title}
                    onChange={(e) =>
                      setAnnouncementForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    placeholder="Announcement title..."
                  />
                </div>

                <div>
                  <Label>Content</Label>
                  <Textarea
                    value={announcementForm.content}
                    onChange={(e) =>
                      setAnnouncementForm((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Announcement content..."
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Type</Label>
                    <Select
                      value={announcementForm.type}
                      onValueChange={(value) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          type: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="alert">Alert</SelectItem>
                        <SelectItem value="info">Information</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priority</Label>
                    <Select
                      value={announcementForm.priority}
                      onValueChange={(value) =>
                        setAnnouncementForm((prev) => ({
                          ...prev,
                          priority: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={createAnnouncement}>
                    <Megaphone className="h-4 w-4 mr-2" />
                    Create Announcement
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowAnnouncementForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Active Announcements */}
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {announcement.title}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">{announcement.type}</Badge>
                        <Badge
                          variant={
                            announcement.priority === "urgent"
                              ? "destructive"
                              : announcement.priority === "high"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {announcement.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{announcement.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Users Management Tab */}
      {activeTab === "users" && (
        <div className="space-y-6">
          {/* User Filters */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and roles</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div>
                  <Label>Role Filter</Label>
                  <Select
                    value={userRoleFilter}
                    onValueChange={setUserRoleFilter}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="citizen">Citizens</SelectItem>
                      <SelectItem value="official">Officials</SelectItem>
                      <SelectItem value="admin">Admins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <div className="space-y-4">
            {usersLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading users...</p>
                </CardContent>
              </Card>
            ) : users.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No users found.</p>
                </CardContent>
              </Card>
            ) : (
              users.map((user) => (
                <Card key={user.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {user.display_name || "Unknown User"}
                        </CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge
                            variant={
                              user.role === "admin"
                                ? "destructive"
                                : user.role === "official"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                          <Badge variant="outline">
                            {user.issues_count} issues
                          </Badge>
                          <Badge variant="outline">
                            {user.votes_count} votes
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right text-sm text-muted-foreground">
                        <div>
                          Joined{" "}
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) =>
                          updateUserRole(user.id, newRole)
                        }
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="citizen">Citizen</SelectItem>
                          <SelectItem value="official">Official</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Departments Management Tab */}
      {activeTab === "departments" && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Department Management</CardTitle>
                <CardDescription>
                  Manage government departments and their assignments
                </CardDescription>
              </div>
              <Button onClick={() => setShowDepartmentForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Department
              </Button>
            </CardHeader>
          </Card>

          {/* Department Form */}
          {showDepartmentForm && (
            <Card>
              <CardHeader>
                <CardTitle>Create New Department</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Department Name</Label>
                  <Input
                    value={departmentForm.name}
                    onChange={(e) =>
                      setDepartmentForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Department name..."
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={departmentForm.description}
                    onChange={(e) =>
                      setDepartmentForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Department description..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={createDepartment}>
                    <Building className="h-4 w-4 mr-2" />
                    Create Department
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDepartmentForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Departments List */}
          <div className="space-y-4">
            {departmentsLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">
                    Loading departments...
                  </p>
                </CardContent>
              </Card>
            ) : departments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No departments found.</p>
                </CardContent>
              </Card>
            ) : (
              departments.map((department) => (
                <Card key={department.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">
                          {department.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {department.description || "No description"}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">
                            {department.officials_count} officials
                          </Badge>
                          <Badge variant="outline">
                            {department.assignments_count} assignments
                          </Badge>
                          <Badge variant="outline">
                            {department.regions_count} regions
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDepartment(department)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedDepartment(department)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
