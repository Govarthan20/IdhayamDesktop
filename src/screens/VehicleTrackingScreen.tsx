import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getInvoicedVehicleList, getVehicleTracking } from '../api';
import { useSession } from '../context/SessionContext';
import { MdArrowBack, MdRefresh, MdLocalShipping } from 'react-icons/md';

export interface VehicleTrip {
  vehicleNo: string;
  tripRefNo: string;
  tripId: string;
  tripTransId?: string;
  branchId?: string;
}

const generateMapHTML = (lat: number, lng: number, vehicleNo: string, stops: any[] = []) => {
  const stopsJson = JSON.stringify(stops);
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBHB7JTRK2tDsEK-AaJyFVJuMj2d7H2cLk"></script>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{height:100%;width:100%;overflow:hidden;background:#d5dce6}</style>
</head><body><div id="map"></div>
<script>
var lat=${lat},lng=${lng},stops=${stopsJson},vehicleNo='${vehicleNo||'Vehicle'}';
function initMap(){
  var map=new google.maps.Map(document.getElementById('map'),{zoom:15,center:{lat:lat,lng:lng},disableDefaultUI:true,mapTypeId:'roadmap',gestureHandling:'greedy'});
  var svgContent='<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><circle cx="25" cy="25" r="22" fill="#3861FB" stroke="#FFFFFF" stroke-width="4"/><g transform="translate(13,13)"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="#FFFFFF"/></g></svg>';
  var truckIcon={url:'data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svgContent),scaledSize:new google.maps.Size(46,46),anchor:new google.maps.Point(23,23)};
  var marker=new google.maps.Marker({position:{lat:lat,lng:lng},map:map,icon:truckIcon,title:vehicleNo,zIndex:1000});
  var iw=new google.maps.InfoWindow({content:'<div style="font-family:sans-serif;text-align:center;padding:4px 6px;"><b style="color:#1A1A1A;font-size:14px;display:block;margin-bottom:6px;">'+vehicleNo+'</b><span style="background:#10B981;color:#fff;padding:3px 8px;border-radius:10px;font-size:9px;font-weight:900;">LIVE</span></div>'});
  iw.open(map,marker);
  if(stops&&stops.length>0){
    var pathCoords=[],bounds=new google.maps.LatLngBounds();
    stops.forEach(function(s){
      var pos={lat:parseFloat(s.lat),lng:parseFloat(s.lng)};
      if(isNaN(pos.lat)||isNaN(pos.lng))return;
      pathCoords.push(pos);bounds.extend(pos);
      if(!s.isCurrent){
        var st=(s.status||'').toLowerCase();
        var c=st.indexOf('complete')>=0?'#27AE60':st.indexOf('progress')>=0?'#3861FB':'#F59E0B';
        var sm=new google.maps.Marker({position:pos,map:map,icon:{path:google.maps.SymbolPath.CIRCLE,scale:8,fillColor:c,fillOpacity:1,strokeColor:'#FFFFFF',strokeWeight:2}});
        var addr=(s.address||'Stop').replace(/'/g,'');
        var si=new google.maps.InfoWindow({content:'<div style="font-family:sans-serif;max-width:220px;"><b style="font-size:12px;">'+addr+'</b><br><span style="font-size:10px;color:'+c+'">'+(s.status||'')+'</span></div>'});
        sm.addListener('click',function(){si.open(map,sm);});
      }
    });
    if(pathCoords.length>1){
      new google.maps.Polyline({path:pathCoords,geodesic:true,strokeColor:'#3861FB',strokeOpacity:0.7,strokeWeight:3,map:map});
      map.fitBounds(bounds);
    }
  }
}
window.onload=initMap;
</script></body></html>`;
};

const VehicleTrackingScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSession();
  const routeState = (location.state as any) || {};

  const [vehicles, setVehicles] = useState<VehicleTrip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<VehicleTrip | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [mapHtml, setMapHtml] = useState('');
  const [locData, setLocData] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const pickInitialTrip = useCallback((list: VehicleTrip[]): VehicleTrip | null => {
    if (routeState.tripId) {
      const match = list.find(v => v.tripId === String(routeState.tripId));
      if (match) return match;
      if (routeState.vehicleNo || routeState.tripRefNo) {
        return {
          vehicleNo: routeState.vehicleNo || '—',
          tripRefNo: routeState.tripRefNo || '',
          tripId: String(routeState.tripId),
          branchId: session?.branchId,
        };
      }
    }
    return list.length > 0 ? list[0] : null;
  }, [routeState, session?.branchId]);

  const fetchVehicleList = useCallback(async () => {
    setListLoading(true);
    try {
      const vehicleList = await getInvoicedVehicleList(session?.custId, session?.branchId);
      let list = Array.isArray(vehicleList) ? vehicleList : [];
      if (list.length === 0 && routeState.tripRefNo) {
        list = [{
          vehicleNo: routeState.vehicleNo || '—',
          tripRefNo: routeState.tripRefNo,
          tripId: String(routeState.tripId || '216'),
          branchId: routeState.branchId || session?.branchId || '51',
        }];
      }
      setVehicles(list);
      setSelectedTrip(prev => {
        if (prev && list.some(v => v.tripId === prev.tripId && v.tripRefNo === prev.tripRefNo)) return prev;
        return pickInitialTrip(list);
      });
    } catch {
      const fallback = routeState.tripRefNo ? [{
        vehicleNo: routeState.vehicleNo || '—',
        tripRefNo: routeState.tripRefNo,
        tripId: String(routeState.tripId || '216'),
        branchId: routeState.branchId || session?.branchId || '51',
      }] : [];
      setVehicles(fallback);
      if (fallback.length > 0) setSelectedTrip(fallback[0]);
    } finally {
      setListLoading(false);
    }
  }, [session, pickInitialTrip, routeState]);

  const fetchLocation = useCallback(async (trip: VehicleTrip) => {
    if (!trip.tripId || !trip.tripRefNo) {
      setLocData(null);
      setMapHtml('');
      setTrackingLoading(false);
      return;
    }
    setTrackingLoading(true);
    try {
      const branchId = trip.branchId || session?.branchId || '51';
      const data = await getVehicleTracking(branchId, trip.tripId, trip.tripRefNo);
      if (!data) {
        setLocData(null);
        setMapHtml('');
        return;
      }
      const lat = Number(data.latitude);
      const lng = Number(data.longitude);
      const vehicleLabel = data.vehicleNo || trip.vehicleNo || 'Vehicle';
      setLocData(data);
      setMapHtml(generateMapHTML(lat, lng, vehicleLabel, data.stops || []));
    } catch {
      setLocData(null);
      setMapHtml('');
    } finally {
      setTrackingLoading(false);
    }
  }, [session?.branchId]);

  useEffect(() => { fetchVehicleList(); }, [fetchVehicleList]);

  useEffect(() => {
    if (!selectedTrip) {
      setLocData(null);
      setMapHtml('');
      return;
    }
    fetchLocation(selectedTrip);
    const interval = setInterval(() => fetchLocation(selectedTrip), 30000);
    return () => clearInterval(interval);
  }, [selectedTrip, fetchLocation]);

  const [mapBlobUrl, setMapBlobUrl] = useState('');
  useEffect(() => {
    if (!mapHtml) {
      setMapBlobUrl('');
      return;
    }
    const url = URL.createObjectURL(new Blob([mapHtml], { type: 'text/html' }));
    setMapBlobUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [mapHtml]);
  const displayVehicle = locData?.vehicleNo || selectedTrip?.vehicleNo || 'Not Available';
  const displayTripRef = locData?.tripRefNo || selectedTrip?.tripRefNo || '—';
  const displayStatus = locData?.status || (trackingLoading ? 'Updating...' : selectedTrip ? 'Awaiting location' : 'Select a trip');

  const blueSlide = (
    <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: '#3861FB', background: 'linear-gradient(135deg, #3861FB 0%, #2752E7 100%)', borderRadius: 20, padding: 16, boxShadow: '0 8px 30px rgba(56,97,251,0.4)', border: '1px solid rgba(255,255,255,0.15)', zIndex: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.75)', margin: '0 0 4px', letterSpacing: 1 }}>VEHICLE NO</p>
          <p style={{ fontSize: 20, fontWeight: 900, color: '#fff', margin: 0 }}>{displayVehicle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', padding: '5px 10px', borderRadius: 20 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff', marginRight: 5, animation: locData ? 'pulse 1.5s infinite' : 'none' }} />
          <span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>LIVE</span>
        </div>
      </div>
      <div style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: '10px 14px' }}>
        <p style={{ fontSize: 9, fontWeight: 900, color: 'rgba(255,255,255,0.75)', margin: '0 0 4px', letterSpacing: 1 }}>TRIP REF NO</p>
        <p style={{ fontSize: 14, fontWeight: 900, color: '#fff', margin: 0 }}>{displayTripRef}</p>
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', margin: '10px 0 0' }}>
        Status: {displayStatus}
      </p>
    </div>
  );

  return (
    <div style={{ height: '100%', backgroundColor: '#E2E8F0', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#E2E8F0', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>Vehicle Tracking</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>
            {selectedTrip?.vehicleNo ? `Tracking ${selectedTrip.vehicleNo}` : 'Select a trip to track on map'}
          </p>
        </div>
        <button
          onClick={() => selectedTrip ? fetchLocation(selectedTrip) : fetchVehicleList()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#EEF2FF', border: 'none', cursor: 'pointer' }}
        >
          <MdRefresh size={16} color="#3861FB" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#3861FB' }}>Refresh</span>
        </button>
      </div>

      {/* Available vehicles — always visible */}
      <div style={{ flexShrink: 0, backgroundColor: '#fff', borderBottom: '1px solid #E2E8F0', padding: '14px 20px', maxHeight: 220, overflowY: 'auto' }}>
        <p style={{ fontSize: 12, fontWeight: 900, color: '#0F172A', margin: '0 0 10px', letterSpacing: 0.5 }}>
          AVAILABLE VEHICLES ({vehicles.length})
        </p>
        {listLoading ? (
          <p style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', margin: 0 }}>Loading available vehicles...</p>
        ) : vehicles.length === 0 ? (
          <p style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', margin: 0 }}>No active vehicles available</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {vehicles.map((trip, idx) => {
              const isSelected = selectedTrip?.tripId === trip.tripId && selectedTrip?.tripRefNo === trip.tripRefNo;
              return (
                <button
                  key={`${trip.tripId}-${trip.tripRefNo}-${idx}`}
                  type="button"
                  onClick={() => setSelectedTrip(trip)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 14px',
                    borderRadius: 14,
                    border: `2px solid ${isSelected ? '#3861FB' : '#E2E8F0'}`,
                    backgroundColor: isSelected ? '#EEF2FF' : '#F8FAFC',
                    cursor: 'pointer',
                    boxShadow: isSelected ? '0 4px 12px rgba(56,97,251,0.12)' : 'none',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: isSelected ? 'linear-gradient(135deg, #3861FB, #2752E7)' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MdLocalShipping size={20} color={isSelected ? '#fff' : '#64748B'} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', margin: 0 }}>{trip.vehicleNo}</p>
                    <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', margin: '2px 0 0' }}>
                      Trip Ref: {trip.tripRefNo} · Trip ID: {trip.tripId}
                    </p>
                  </div>
                  {isSelected && (
                    <span style={{ fontSize: 10, fontWeight: 900, color: '#3861FB', backgroundColor: '#DBEAFE', padding: '4px 8px', borderRadius: 8, flexShrink: 0 }}>TRACKING</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ flex: 1, position: 'relative', backgroundColor: '#d5dce6' }}>
        {(listLoading || trackingLoading) && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
            <div style={{ width: 40, height: 40, border: '4px solid #EDF2F7', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}
        {!listLoading && !trackingLoading && !selectedTrip && vehicles.length > 0 && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#64748B' }}>Select a trip above to view live map</p>
          </div>
        )}
        {!trackingLoading && mapBlobUrl && (
          <iframe ref={iframeRef} src={mapBlobUrl} style={{ width: '100%', height: '100%', border: 'none' }} />
        )}
        {!trackingLoading && selectedTrip && !mapBlobUrl && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#64748B' }}>Map will appear when location is available</p>
          </div>
        )}
        {blueSlide}
      </div>
    </div>
  );
};

export default VehicleTrackingScreen;
