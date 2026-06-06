import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapClickHandler({ setLocation }) {
    useMapEvents({
        click(e) {
            setLocation({
                latitude: e.latlng.lat,
                longitude: e.latlng.lng,
                address: ''
            });
        },
    });
    return null;
}

function MapUpdater({ center }) {
    const map = useMap();
    useEffect(() => {
        if (center[0] !== 0 || center[1] !== 0) {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map]);
    return null;
}

export default function LocationPicker({ location, setLocation }) {
    const [mode, setMode] = useState('none'); // 'none', 'gps', 'map'
    const [gpsLoading, setGpsLoading] = useState(false);
    const [mapCenter, setMapCenter] = useState([20.5937, 78.9629]); // Default to India roughly

    const getGPS = () => {
        if (!navigator.geolocation) { 
            alert('Geolocation not supported'); 
            return; 
        }
        setGpsLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, address: '' });
                setMapCenter([pos.coords.latitude, pos.coords.longitude]);
                setMode('gps');
                setGpsLoading(false);
            },
            () => { 
                alert('Location permission denied. Please pick from map.'); 
                setMode('map');
                setGpsLoading(false); 
            }
        );
    };

    return (
        <div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
                <button type="button" className={`btn ${mode === 'gps' ? 'btn-primary' : 'btn-outline'}`} onClick={getGPS} disabled={gpsLoading}>
                    {gpsLoading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '📍'} Use My Location
                </button>
                <button type="button" className={`btn ${mode === 'map' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('map')}>
                    🗺️ Pick from Map
                </button>
            </div>

            {mode === 'map' && (
                <div style={{ height: 300, width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 16 }}>
                    <MapContainer center={mapCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler setLocation={setLocation} />
                        <MapUpdater center={mapCenter} />
                        {location.latitude && location.longitude && (
                            <Marker position={[location.latitude, location.longitude]} />
                        )}
                    </MapContainer>
                </div>
            )}

            {location.latitude && (
                <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    ✅ <span style={{ fontSize: 14, color: 'var(--low)', fontWeight: 600 }}>Location Secured:</span>
                    <span style={{ fontSize: 14, fontFamily: 'monospace' }}>{location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}</span>
                </div>
            )}

            <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="label">Address / Landmark (optional)</label>
                <input className="input" value={location.address}
                    onChange={(e) => setLocation({ ...location, address: e.target.value })}
                    placeholder="e.g. Near Central Park, Gate 3" />
            </div>
        </div>
    );
}
