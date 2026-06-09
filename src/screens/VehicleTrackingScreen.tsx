import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getVehicleTracking } from '../api';
import { useSession } from '../context/SessionContext';
import { MdArrowBack, MdRefresh } from 'react-icons/md';

const generateMapHTML = (lat: number, lng: number, vehicleNo: string, stops: any[] = []) => {
  const stopsJson = JSON.stringify(stops);
  return `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBHB7JTRK2tDsEK-AaJyFVJuMj2d7H2cLk"></script>
<style>*{margin:0;padding:0;box-sizing:border-box}html,body,#map{height:100%;width:100%;overflow:hidden;background:#e5e9f0}</style>
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
      pathCoords.push(pos);bounds.extend(pos);
      var isCurr=Math.abs(pos.lat-lat)<0.0001&&Math.abs(pos.lng-lng)<0.0001;
      if(!isCurr){
        var c=s.status==='Completed'?'#27AE60':'#8E8E93';
        var sm=new google.maps.Marker({position:pos,map:map,icon:{path:google.maps.SymbolPath.CIRCLE,scale:8,fillColor:c,fillOpacity:1,strokeColor:'#FFFFFF',strokeWeight:2}});
        var si=new google.maps.InfoWindow({content:'<div style="font-family:sans-serif;max-width:200px;"><b style="font-size:12px;">'+s.address+'</b><br><span style="font-size:10px;color:'+c+'">'+s.status+'</span></div>'});
        sm.addListener('click',function(){si.open(map,sm);});
      }
    });
    if(pathCoords.length>1)map.fitBounds(bounds);
  }
}
window.onload=initMap;
</script></body></html>`;
};

const VehicleTrackingScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useSession();
  const { vehicleNo, tripRefNo, tripId } = (location.state as any) || {};
  const [loading, setLoading] = useState(true);
  const [mapHtml, setMapHtml] = useState('');
  const [locData, setLocData] = useState<any>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const fetchLocation = async () => {
    if (!tripId || !tripRefNo) return;
    try {
      const branchId = session?.branchId || '51';
      const data = await getVehicleTracking(branchId, tripId, tripRefNo);
      const lat = data?.latitude ? Number(data.latitude) : 11.0168;
      const lng = data?.longitude ? Number(data.longitude) : 76.9558;
      setLocData(data);
      setMapHtml(generateMapHTML(lat, lng, vehicleNo, data?.stops || []));
    } catch { alert('Unable to fetch vehicle tracking location.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLocation();
    const interval = setInterval(fetchLocation, 30000);
    return () => clearInterval(interval);
  }, [tripId, tripRefNo]);

  const blobUrl = mapHtml ? URL.createObjectURL(new Blob([mapHtml], { type: 'text/html' })) : '';

  return (
    <div style={{ height: '100%', backgroundColor: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '22px 36px 18px', backgroundColor: '#fff', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#F1F5F9', border: 'none', cursor: 'pointer', marginRight: 20, flexShrink: 0 }}>
          <MdArrowBack size={16} color="#64748B" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#64748B' }}>Back</span>
        </button>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>Vehicle Tracking</p>
          <p style={{ fontSize: 13, color: '#64748B', fontWeight: 600, margin: '2px 0 0' }}>{vehicleNo ? `Live routing for ${vehicleNo}` : 'Live status'}</p>
        </div>
        <button onClick={fetchLocation} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, backgroundColor: '#EEF2FF', border: 'none', cursor: 'pointer' }}>
          <MdRefresh size={16} color="#3861FB" />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#3861FB' }}>Refresh</span>
        </button>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 40, height: 40, border: '4px solid #EDF2F7', borderTopColor: '#3861FB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      ) : (
        <div style={{ flex: 1, position: 'relative' }}>
          {blobUrl && <iframe ref={iframeRef} src={blobUrl} style={{ width: '100%', height: '100%', border: 'none' }} onLoad={() => { if (blobUrl) URL.revokeObjectURL(blobUrl); }} />}
          {locData && (
            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 20, padding: 16, backdropFilter: 'blur(10px)', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 900, color: '#94A3B8', margin: '0 0 4px', letterSpacing: 1 }}>VEHICLE NO</p>
                  <p style={{ fontSize: 20, fontWeight: 900, color: '#1A1A1A', margin: 0 }}>{vehicleNo}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#EF4444', padding: '5px 10px', borderRadius: 20 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff', marginRight: 5 }} />
                  <span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>LIVE</span>
                </div>
              </div>
              {tripRefNo && (
                <div style={{ marginTop: 12, backgroundColor: '#F8F9FD', borderRadius: 12, padding: '10px 14px' }}>
                  <p style={{ fontSize: 9, fontWeight: 900, color: '#94A3B8', margin: '0 0 4px', letterSpacing: 1 }}>TRIP REF NO</p>
                  <p style={{ fontSize: 14, fontWeight: 900, color: '#1A1A1A', margin: 0 }}>{tripRefNo}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleTrackingScreen;
