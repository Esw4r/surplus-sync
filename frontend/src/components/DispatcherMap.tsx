"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";

interface MapProps {
    tasks: any[];
    volunteers: any[];
    ngos: any[];
    donors: any[];
}

const containerStyle = {
    width: "100%",
    height: "100%",
    borderRadius: "0.75rem",
};

const defaultCenter = {
    lat: 12.9716, // Bangalore default (or user's city)
    lng: 77.5946,
};

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = ["places", "geometry"];

export default function DispatcherMap({ tasks, volunteers, ngos, donors }: MapProps) {
    const { isLoaded, loadError } = useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries,
    });

    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [selectedMarker, setSelectedMarker] = useState<any | null>(null);

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    // Filter active tasks for map
    const activeTasks = useMemo(() => tasks.filter(t =>
        ["PENDING", "ASSIGNED", "IN_TRANSIT", "PICKED_UP"].includes(t.status)
    ), [tasks]);

    if (loadError) {
        return <div className="w-full h-full flex items-center justify-center bg-red-900/20 text-red-400 rounded-xl">Map Error: {loadError.message}</div>;
    }

    if (!isLoaded) {
        return <div className="w-full h-full flex items-center justify-center bg-slate-900/50 rounded-xl text-slate-400">Loading Map...</div>;
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
                styles: [
                    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                    {
                        featureType: "administrative.locality",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                    },
                    {
                        featureType: "poi",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                    },
                    {
                        featureType: "poi.park",
                        elementType: "geometry",
                        stylers: [{ color: "#263c3f" }],
                    },
                    {
                        featureType: "poi.park",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#6b9a76" }],
                    },
                    {
                        featureType: "road",
                        elementType: "geometry",
                        stylers: [{ color: "#38414e" }],
                    },
                    {
                        featureType: "road",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#212a37" }],
                    },
                    {
                        featureType: "road",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#9ca5b3" }],
                    },
                    {
                        featureType: "road.highway",
                        elementType: "geometry",
                        stylers: [{ color: "#746855" }],
                    },
                    {
                        featureType: "road.highway",
                        elementType: "geometry.stroke",
                        stylers: [{ color: "#1f2835" }],
                    },
                    {
                        featureType: "road.highway",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#f3d19c" }],
                    },
                    {
                        featureType: "transit",
                        elementType: "geometry",
                        stylers: [{ color: "#2f3948" }],
                    },
                    {
                        featureType: "transit.station",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#d59563" }],
                    },
                    {
                        featureType: "water",
                        elementType: "geometry",
                        stylers: [{ color: "#17263c" }],
                    },
                    {
                        featureType: "water",
                        elementType: "labels.text.fill",
                        stylers: [{ color: "#515c6d" }],
                    },
                    {
                        featureType: "water",
                        elementType: "labels.text.stroke",
                        stylers: [{ color: "#17263c" }],
                    },
                ],
                disableDefaultUI: false,
                zoomControl: true,
                streetViewControl: false,
                mapTypeControl: false,
            }}
        >
            {/* NGOs (Green) */}
            {ngos.map((ngo) => (
                <Marker
                    key={`ngo-${ngo.id}`}
                    position={{ lat: Number(ngo.latitude) || 0, lng: Number(ngo.longitude) || 0 }}
                    icon={"http://maps.google.com/mapfiles/ms/icons/green-dot.png"}
                    onClick={() => setSelectedMarker({ type: "NGO", data: ngo })}
                />
            ))}

            {/* Donors (Red) */}
            {donors.map((donor) => (
                <Marker
                    key={`donor-${donor.id}`}
                    position={{ lat: Number(donor.latitude) || 0, lng: Number(donor.longitude) || 0 }}
                    icon={"http://maps.google.com/mapfiles/ms/icons/red-dot.png"}
                    onClick={() => setSelectedMarker({ type: "Donor", data: donor })}
                />
            ))}

            {/* Volunteers (Blue) */}
            {volunteers.map((vol) => (
                <Marker
                    key={`vol-${vol.id}`}
                    position={{ lat: Number(vol.latitude) || 0, lng: Number(vol.longitude) || 0 }}
                    icon={"http://maps.google.com/mapfiles/ms/icons/blue-dot.png"}
                    onClick={() => setSelectedMarker({ type: "Volunteer", data: vol })}
                />
            ))}

            {/* Active Tasks (Yellow - Pickup Locations) */}
            {activeTasks.map((task) => (
                <Marker
                    key={`task-${task.id}`}
                    position={{ lat: Number(task.pickup_lat) || 0, lng: Number(task.pickup_lng) || 0 }}
                    icon={"http://maps.google.com/mapfiles/ms/icons/yellow-dot.png"}
                    onClick={() => setSelectedMarker({ type: "Task", data: task })}
                />
            ))}

            {selectedMarker && (
                <InfoWindow
                    position={{
                        lat: Number(selectedMarker.data.latitude || selectedMarker.data.pickup_lat) || 0,
                        lng: Number(selectedMarker.data.longitude || selectedMarker.data.pickup_lng) || 0,
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                >
                    <div className="text-black p-2 min-w-[150px]">
                        <h3 className="font-bold border-b pb-1 mb-1">
                            {selectedMarker.type}: {selectedMarker.data.name || selectedMarker.data.organization_name || selectedMarker.data.food_type}
                        </h3>
                        {selectedMarker.type === "Task" && (
                            <>
                                <p>Qty: {selectedMarker.data.quantity_kg} kg</p>
                                <p>Status: {selectedMarker.data.status}</p>
                            </>
                        )}
                        {selectedMarker.type === "Volunteer" && (
                            <>
                                <p>Status: {selectedMarker.data.status}</p>
                                <p>Phone: {selectedMarker.data.phone}</p>
                            </>
                        )}
                        {selectedMarker.type === "NGO" && (
                            <p>Status: {selectedMarker.data.verification_status}</p>
                        )}
                    </div>
                </InfoWindow>
            )}

            {/* Map Legend */}
            <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-700 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                <h4 className="text-white font-semibold text-sm mb-2">Map Legend</h4>
                <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-slate-300">NGOs</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-slate-300">Donors</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-slate-300">Volunteers</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-slate-300">Active Tasks</span>
                    </div>
                </div>
            </div>
        </GoogleMap>
    );
}
