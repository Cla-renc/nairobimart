"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Eye, Send, Loader2, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Ticket {
  id: string;
  name: string;
  email: string;
  subject: string;
  ticketCode: string;
  status: string;
  createdAt: string;
}

interface TicketDetail extends Ticket {
  message: string;
  response?: string;
  responseAt?: string;
}

export default function ContactMessagesClient() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/contact-messages");
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      setTickets(data);
    } catch (error) {
      toast({ title: "Error", description: "Unable to load contact tickets.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const openTicket = async (id: string) => {
    setDetailLoading(true);
    setSelected(null);
    try {
      const res = await fetch(`/api/admin/contact-messages/${id}`);
      if (!res.ok) throw new Error("Failed to load ticket");
      const data = await res.json();
      setSelected(data);
      setReply(data.response || "");
    } catch (error) {
      toast({ title: "Error", description: "Unable to load ticket details.", variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    if (!reply.trim()) {
      toast({ title: "Missing reply", description: "Enter your response before saving.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contact-messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, response: reply.trim(), status: "responded" }),
      });
      if (!res.ok) throw new Error("Failed to save response");
      const updated = await res.json();
      toast({ title: "Saved", description: "Ticket response saved." });
      setSelected((prev) => prev ? { ...prev, response: updated.response, status: updated.status, responseAt: updated.responseAt } : prev);
      fetchTickets();
    } catch (error) {
      toast({ title: "Error", description: "Unable to save response.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const filteredTickets = tickets.filter((ticket) => {
    const q = search.toLowerCase();
    return (
      ticket.name.toLowerCase().includes(q) ||
      ticket.email.toLowerCase().includes(q) ||
      ticket.subject.toLowerCase().includes(q) ||
      ticket.ticketCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary">Contact Tickets</h1>
          <p className="text-muted-foreground mt-1">Respond to customer messages and track ticket status.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by name, email, subject, or ticket code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-lg"
          />
          <Button variant="outline" onClick={fetchTickets} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle>Incoming Messages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        No tickets found.
                      </TableCell>
                    </TableRow>
                  )}
                              {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>{ticket.name}</TableCell>
                      <TableCell>{ticket.subject}</TableCell>
                      <TableCell className="font-mono text-[13px]">{ticket.ticketCode}</TableCell>
                      <TableCell>{ticket.status}</TableCell>
                      <TableCell>{format(new Date(ticket.createdAt), "MMM dd, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openTicket(ticket.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle>Ticket details</CardTitle>
          </CardHeader>
          <CardContent>
            {detailLoading ? (
              <div className="h-72 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : selected ? (
              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-4">
                  <p className="text-sm text-muted-foreground">Ticket Code</p>
                  <p className="font-mono text-lg">{selected.ticketCode}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">From</p>
                  <p>{selected.name} • {selected.email}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-semibold">{selected.subject}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Message</p>
                  <p className="whitespace-pre-wrap">{selected.message}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Response</p>
                  <Textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    className="min-h-[150px]"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Save Response
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    When saved, the ticket status is updated to responded and your reply will be available to the customer when they track the ticket.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center text-muted-foreground">
                Select a ticket to view details.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
