"use client";

import { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Zone {
    id: string;
    name: string;
    fee: number | string;
    isActive: boolean;
}

export default function LogisticsClient({ initialZones }: { initialZones: Zone[] }) {
    const [zones, setZones] = useState(initialZones);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Zone Modal State
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<Zone | null>(null);
    const [zoneFormData, setZoneFormData] = useState({ name: "", fee: "", isActive: true });

    const openZoneModal = (zone: Zone | null = null) => {
        if (zone) {
            setEditingZone(zone);
            setZoneFormData({ name: zone.name, fee: zone.fee.toString(), isActive: zone.isActive });
        } else {
            setEditingZone(null);
            setZoneFormData({ name: "", fee: "", isActive: true });
        }
        setIsZoneModalOpen(true);
    };

    const saveZone = async () => {
        try {
            setIsLoading(true);
            const url = editingZone ? `/api/admin/delivery-zones/${editingZone.id}` : `/api/admin/delivery-zones`;
            const method = editingZone ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(zoneFormData),
            });

            if (!res.ok) throw new Error("Failed to save zone");

            const { zone } = await res.json();
            if (editingZone) {
                setZones(zones.map((z: Zone) => z.id === zone.id ? zone : z));
                toast({ title: "Zone updated successfully" });
            } else {
                setZones([...zones, zone]);
                toast({ title: "Zone created successfully" });
            }
            setIsZoneModalOpen(false);
        } catch {
            toast({ title: "Error saving zone", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const deleteZone = async (id: string) => {
        if (!confirm("Are you sure you want to delete this zone?")) return;
        try {
            const res = await fetch(`/api/admin/delivery-zones/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            setZones(zones.filter((z: Zone) => z.id !== id));
            toast({ title: "Zone deleted successfully" });
        } catch {
            toast({ title: "Error deleting zone", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-primary">Logistics</h1>
            </div>

            <Tabs defaultValue="zones">
                <TabsList className="mb-4">
                    <TabsTrigger value="zones">Delivery Zones</TabsTrigger>
                </TabsList>

                {/* Delivery Zones Tab */}
                <TabsContent value="zones" className="bg-white p-6 rounded-lg shadow-sm border border-input">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Manage Door Delivery Zones</h2>
                        <Button onClick={() => openZoneModal()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" /> Add Zone
                        </Button>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Zone Name</TableHead>
                                <TableHead>Fee (KES)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {zones.map((zone) => (
                                <TableRow key={zone.id}>
                                    <TableCell className="font-medium">{zone.name}</TableCell>
                                    <TableCell>{zone.fee}</TableCell>
                                    <TableCell>{zone.isActive ? "Active" : "Inactive"}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openZoneModal(zone)}>
                                            <Edit className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => deleteZone(zone.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {zones.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground py-6">No delivery zones found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>
            </Tabs>

            {/* Zone Modal */}
            <Dialog open={isZoneModalOpen} onOpenChange={setIsZoneModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingZone ? "Edit Delivery Zone" : "Create Delivery Zone"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Zone Name</Label>
                            <Input value={zoneFormData.name} onChange={(e) => setZoneFormData({ ...zoneFormData, name: e.target.value })} placeholder="e.g. Nairobi - CBD" />
                        </div>
                        <div className="space-y-2">
                            <Label>Shipping Fee (KES)</Label>
                            <Input type="number" value={zoneFormData.fee} onChange={(e) => setZoneFormData({ ...zoneFormData, fee: e.target.value })} placeholder="e.g. 500" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch checked={zoneFormData.isActive} onCheckedChange={(c) => setZoneFormData({ ...zoneFormData, isActive: c })} />
                            <Label>Active</Label>
                        </div>
                        <Button className="w-full" onClick={saveZone} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Zone"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
