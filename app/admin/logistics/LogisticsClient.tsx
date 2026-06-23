"use client";

import { useState, useMemo } from "react";
import { Plus, Edit, Trash2, MapPin, Truck, CheckCircle } from "lucide-react";
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
import Map, { Marker, NavigationControl, Popup } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Zone {
    id: string;
    name: string;
    fee: number | string;
    isActive: boolean;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    shippingAddress: string | null;
    shippingCity: string | null;
    total: number;
    user?: { name: string | null; phone: string | null } | null;
}

export default function LogisticsClient({ initialZones, activeOrders = [] }: { initialZones: Zone[], activeOrders?: Order[] }) {
    const [zones, setZones] = useState(initialZones);
    const [orders, setOrders] = useState(activeOrders);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    // Map State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDispatchSheetOpen, setIsDispatchSheetOpen] = useState(false);
    const [dispatchingId, setDispatchingId] = useState<string | null>(null);

    // Zone Modal State
    const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
    const [editingZone, setEditingZone] = useState<Zone | null>(null);
    const [zoneFormData, setZoneFormData] = useState({ name: "", fee: "", isActive: true });

    // Generate pseudo-random coordinates around Nairobi for the demo
    const mapMarkers = useMemo(() => {
        return orders.map((order, i) => {
            // Nairobi center: -1.2921, 36.8219
            // Add slight jitter for demo purposes since we don't have real geocoding yet
            const lat = -1.2921 + (Math.sin(i * 10) * 0.05);
            const lng = 36.8219 + (Math.cos(i * 10) * 0.05);
            return { ...order, lat, lng };
        });
    }, [orders]);

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

    const requestDispatch = async (orderId: string) => {
        try {
            setDispatchingId(orderId);
            const res = await fetch(`/api/admin/logistics/dispatch`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId }),
            });

            if (!res.ok) throw new Error("Dispatch failed");

            const data = await res.json();
            
            toast({ 
                title: "Rider Dispatched Successfully!", 
                description: `Tracking Link: ${data.trackingUrl}`,
                variant: "default",
                className: "bg-green-600 text-white"
            });
            
            // Remove from map
            setOrders(orders.filter(o => o.id !== orderId));
            setIsDispatchSheetOpen(false);

        } catch (error) {
            toast({ title: "Dispatch Request Failed", variant: "destructive" });
        } finally {
            setDispatchingId(null);
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-primary">Logistics Command Center</h1>
            </div>

            <Tabs defaultValue="map" className="flex-1 flex flex-col">
                <TabsList className="mb-4">
                    <TabsTrigger value="map">Live Route Map</TabsTrigger>
                    <TabsTrigger value="zones">Delivery Zones</TabsTrigger>
                </TabsList>

                {/* Live Map Tab */}
                <TabsContent value="map" className="flex-1 min-h-[600px] relative rounded-lg overflow-hidden border">
                    {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
                        <Map
                            mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
                            initialViewState={{
                                longitude: 36.8219,
                                latitude: -1.2921,
                                zoom: 11
                            }}
                            mapStyle="mapbox://styles/mapbox/dark-v11"
                        >
                            <NavigationControl position="top-left" />
                            
                            {mapMarkers.map(marker => (
                                <Marker 
                                    key={marker.id} 
                                    longitude={marker.lng} 
                                    latitude={marker.lat}
                                    onClick={e => {
                                        e.originalEvent.stopPropagation();
                                        setSelectedOrder(marker);
                                    }}
                                >
                                    <div className="bg-primary text-white p-2 rounded-full cursor-pointer shadow-lg hover:scale-110 transition-transform">
                                        <Truck size={16} />
                                    </div>
                                </Marker>
                            ))}

                            {selectedOrder && (
                                <Popup
                                    longitude={mapMarkers.find(m => m.id === selectedOrder.id)?.lng || 36.8219}
                                    latitude={mapMarkers.find(m => m.id === selectedOrder.id)?.lat || -1.2921}
                                    onClose={() => setSelectedOrder(null)}
                                    className="rounded-xl overflow-hidden"
                                >
                                    <div className="p-2 space-y-2 text-sm text-black">
                                        <p className="font-bold border-b pb-1">Order {selectedOrder.orderNumber}</p>
                                        <p>{selectedOrder.shippingAddress || "Nairobi"} - {selectedOrder.shippingCity}</p>
                                        <p className="font-medium text-primary">KES {selectedOrder.total}</p>
                                        <Button 
                                            size="sm" 
                                            className="w-full mt-2"
                                            onClick={() => {
                                                setIsDispatchSheetOpen(true);
                                                setSelectedOrder(selectedOrder);
                                            }}
                                        >
                                            Request Rider
                                        </Button>
                                    </div>
                                </Popup>
                            )}
                        </Map>
                    ) : (
                        <div className="absolute inset-0 bg-muted flex items-center justify-center flex-col text-center p-6">
                            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-xl font-bold">Mapbox Token Required</h3>
                            <p className="text-muted-foreground mt-2 max-w-md">
                                A NEXT_PUBLIC_MAPBOX_TOKEN is required in your environment variables to render the live routing map. Once added, you will see a clustered heatmap of your {orders.length} pending orders.
                            </p>
                        </div>
                    )}
                </TabsContent>

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

            {/* Dispatch Rider Sheet */}
            <Sheet open={isDispatchSheetOpen} onOpenChange={setIsDispatchSheetOpen}>
                <SheetContent className="sm:max-w-md border-l-0 shadow-2xl">
                    <SheetHeader>
                        <SheetTitle className="flex items-center text-2xl font-black text-primary">
                            <Truck className="mr-3 h-6 w-6" />
                            Dispatch Rider
                        </SheetTitle>
                    </SheetHeader>
                    {selectedOrder && (
                        <div className="py-6 space-y-6">
                            <div className="bg-muted p-4 rounded-xl border">
                                <p className="text-sm text-muted-foreground mb-1">Order Ref</p>
                                <p className="font-bold text-lg">{selectedOrder.orderNumber}</p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-bold">Customer Details</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Name</p>
                                        <p className="font-medium">{selectedOrder.user?.name || "Guest"}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedOrder.user?.phone || "N/A"}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground">Delivery Address</p>
                                        <p className="font-medium">{selectedOrder.shippingAddress || "N/A"} - {selectedOrder.shippingCity}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6 space-y-4">
                                <Button 
                                    className="w-full h-12 text-lg font-bold" 
                                    onClick={() => requestDispatch(selectedOrder.id)}
                                    disabled={dispatchingId === selectedOrder.id}
                                >
                                    {dispatchingId === selectedOrder.id ? "Connecting to Logistics API..." : "Confirm & Send Rider (Sendy)"}
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    This will alert the nearest rider and automatically send a WhatsApp tracking link to the customer.
                                </p>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
