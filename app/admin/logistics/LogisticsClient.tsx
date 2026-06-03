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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function LogisticsClient({ initialZones, initialStations }: { initialZones: any[], initialStations: any[] }) {
    const [zones, setZones] = useState(initialZones);
    const [stations, setStations] = useState(initialStations);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Zone Modal State
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingZone, setEditingZone] = useState<any>(null);
    const [zoneFormData, setZoneFormData] = useState({ name: "", fee: "", isActive: true });

    // Station Modal State
    const [isStationModalOpen, setIsStationModalOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [editingStation, setEditingStation] = useState<any>(null);
    const [stationFormData, setStationFormData] = useState({ name: "", address: "", city: "Nairobi", fee: "", isActive: true });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openZoneModal = (zone: any = null) => {
        if (zone) {
            setEditingZone(zone);
            setZoneFormData({ name: zone.name, fee: zone.fee.toString(), isActive: zone.isActive });
        } else {
            setEditingZone(null);
            setZoneFormData({ name: "", fee: "", isActive: true });
        }
        setIsZoneModalOpen(true);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openStationModal = (station: any = null) => {
        if (station) {
            setEditingStation(station);
            setStationFormData({ name: station.name, address: station.address, city: station.city, fee: station.fee.toString(), isActive: station.isActive });
        } else {
            setEditingStation(null);
            setStationFormData({ name: "", address: "", city: "Nairobi", fee: "", isActive: true });
        }
        setIsStationModalOpen(true);
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
                setZones(zones.map((z) => z.id === zone.id ? zone : z));
                toast({ title: "Zone updated successfully" });
            } else {
                setZones([...zones, zone]);
                toast({ title: "Zone created successfully" });
            }
            setIsZoneModalOpen(false);
        } catch (_error) {
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
            setZones(zones.filter((z) => z.id !== id));
            toast({ title: "Zone deleted successfully" });
        } catch (_error) {
            toast({ title: "Error deleting zone", variant: "destructive" });
        }
    };

    const saveStation = async () => {
        try {
            setIsLoading(true);
            const url = editingStation ? `/api/admin/pickup-stations/${editingStation.id}` : `/api/admin/pickup-stations`;
            const method = editingStation ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(stationFormData),
            });

            if (!res.ok) throw new Error("Failed to save station");

            const { station } = await res.json();
            if (editingStation) {
                setStations(stations.map((s) => s.id === station.id ? station : s));
                toast({ title: "Station updated successfully" });
            } else {
                setStations([...stations, station]);
                toast({ title: "Station created successfully" });
            }
            setIsStationModalOpen(false);
        } catch (_error) {
            toast({ title: "Error saving station", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const deleteStation = async (id: string) => {
        if (!confirm("Are you sure you want to delete this station?")) return;
        try {
            const res = await fetch(`/api/admin/pickup-stations/${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to delete");
            setStations(stations.filter((s) => s.id !== id));
            toast({ title: "Station deleted successfully" });
        } catch (_error) {
            toast({ title: "Error deleting station", variant: "destructive" });
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
                    <TabsTrigger value="stations">Pick-up Stations</TabsTrigger>
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

                {/* Pick-up Stations Tab */}
                <TabsContent value="stations" className="bg-white p-6 rounded-lg shadow-sm border border-input">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Manage Pick-up Stations</h2>
                        <Button onClick={() => openStationModal()} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            <Plus className="mr-2 h-4 w-4" /> Add Station
                        </Button>
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Station Name</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead>City</TableHead>
                                <TableHead>Fee (KES)</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stations.map((station) => (
                                <TableRow key={station.id}>
                                    <TableCell className="font-medium">{station.name}</TableCell>
                                    <TableCell>{station.address}</TableCell>
                                    <TableCell>{station.city}</TableCell>
                                    <TableCell>{station.fee}</TableCell>
                                    <TableCell>{station.isActive ? "Active" : "Inactive"}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openStationModal(station)}>
                                            <Edit className="h-4 w-4 text-blue-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => deleteStation(station.id)}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {stations.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">No pick-up stations found.</TableCell>
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

            {/* Station Modal */}
            <Dialog open={isStationModalOpen} onOpenChange={setIsStationModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingStation ? "Edit Pick-up Station" : "Create Pick-up Station"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Station Name</Label>
                            <Input value={stationFormData.name} onChange={(e) => setStationFormData({ ...stationFormData, name: e.target.value })} placeholder="e.g. Juja City Mall" />
                        </div>
                        <div className="space-y-2">
                            <Label>Address</Label>
                            <Input value={stationFormData.address} onChange={(e) => setStationFormData({ ...stationFormData, address: e.target.value })} placeholder="e.g. Ground Floor, Shop 4" />
                        </div>
                        <div className="space-y-2">
                            <Label>City</Label>
                            <Input value={stationFormData.city} onChange={(e) => setStationFormData({ ...stationFormData, city: e.target.value })} placeholder="e.g. Nairobi" />
                        </div>
                        <div className="space-y-2">
                            <Label>Pick-up Fee (KES)</Label>
                            <Input type="number" value={stationFormData.fee} onChange={(e) => setStationFormData({ ...stationFormData, fee: e.target.value })} placeholder="e.g. 50" />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch checked={stationFormData.isActive} onCheckedChange={(c) => setStationFormData({ ...stationFormData, isActive: c })} />
                            <Label>Active</Label>
                        </div>
                        <Button className="w-full" onClick={saveStation} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Station"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
