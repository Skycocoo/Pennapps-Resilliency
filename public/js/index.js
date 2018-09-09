// load asynchronously

let map;
let lastLat = 0;
let lastLng = 0;
let today = new Date();
let curMarker = {};

let dd = (today.getDate() < 10) ? '0'+today.getDate() : today.getDate();
let mm = (today.getMonth() < 10) ? '0'+ (today.getMonth() - 1) : today.getMonth() - 1; // January is 0!
let yyyy = today.getFullYear();

let disasters = {
    Flood: {
        color: '#6ACBFF',
        radius: 7000
    },
    Fire: {
        color: '#ff312c',
        radius: 8000
    }
};

if (mm <= 0) {
    mm = mm + 11;
    yyyy -= 1;
}

const curDisasterUrl = "http://localhost:3000/curdata";
// const newsUrl = "http://localhost:3000/news";

let directionsService;
let directionsDisplay;

function initMap() {
    directionsService = new google.maps.DirectionsService();
    directionsDisplay = new google.maps.DirectionsRenderer();
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 34.397, lng: -80},
        zoom: 8
    });

    map.data.setStyle(styleFeature);
    loadMapShapes();


    let request = {
        date: `${yyyy}-${mm}-${dd}`
    };

    let xhr = new XMLHttpRequest();
    xhr.open('POST', curDisasterUrl, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            JSON.parse(xhr.response).forEach((event) => {

                let xhr2 = new XMLHttpRequest();
                xhr2.open('GET', `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/geocode/json?components=administrative_area:${event.state}|administrative_area:${event.county}&key=AIzaSyC7ykUUPTmMCeAfmSTnbk0f0cHnYbojaII`, true);
                xhr2.onreadystatechange = function() {
                    if (xhr2.readyState === 4 && xhr2.status === 200 && JSON.parse(xhr2.response).results[0]) {
                        addMarker(JSON.parse(xhr2.response).results[0].geometry.location.lat,
                            JSON.parse(xhr2.response).results[0].geometry.location.lng,
                            event.title, event.type);
                    }
                };
                xhr2.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                xhr2.send();
            });
        }
    };
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send(JSON.stringify(request));

    google.maps.event.addListener(map, "dragend", function () {
        let lat = map.data.map.center.lat();
        let lng = map.data.map.center.lng();

        if (lastLat === 0 && lastLng === 0 || calcCrow(lat, lng) >= 8) {
            lastLat = lat;
            lastLng = lng;
        }
    });
    directionsDisplay.setMap(map);
}

function calcRoute() {
    let uluru = {};
    let xhr = new XMLHttpRequest();
    const url = `https://cors-anywhere.herokuapp.com/https://maps.googleapis.com/maps/api/place/textsearch/json?location=${lastLat},${lastLng}&radius=1500&query=Red%20Cross&key=AIzaSyC7ykUUPTmMCeAfmSTnbk0f0cHnYbojaII`;
    xhr.open('GET', url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            uluru.lat = JSON.parse(xhr.responseText).results[0].geometry.location.lat;
            uluru.lng = JSON.parse(xhr.responseText).results[0].geometry.location.lng;

            let request = {
                origin: {lat: curMarker.lat, lng: curMarker.lng},
                destination: uluru,
                travelMode: "DRIVING"
            };
            directionsService.route(request, function(response, status) {
                if (status === 'OK') {
                    directionsDisplay.setDirections(response);
                }
            });
        }
    };
    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhr.send();

}

function addMarker(lat, lng, title, disaster) {
    let uluru = {lat, lng};
    let marker = new google.maps.Marker({
        position: uluru,
        title,
        map: map
    });

    let circle  = new google.maps.Circle({
        strokeColor: (disasters[disaster]  === undefined) ? '#8d8d8d' : disasters[disaster].color,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: (disasters[disaster]  === undefined) ? '#8d8d8d' : disasters[disaster].color,
        fillOpacity: 0.1,
        map: map,
        center: uluru,
        radius: (disasters[disaster]  === undefined) ? 3000 : disasters[disaster].radius
    });

    marker.addListener('click', function() {
        let modal = $('#modal');
        // modal.find('.modal_title').text("TEST");
        $('#modal-title').text(title);
        modal.modal();
        map.setCenter(uluru);
        map.setZoom(11);
        curMarker = uluru;
    })
}

function addCustomMarker() {
    let icons = {
        lightning: {
            icon: '/img/lightning2u.png'
        }
    };

    let image = {
        url: icons.lightning.icon,
        size: new google.maps.Size(50, 50),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 32),
        scaledSize: new google.maps.Size(40, 40)
    };

    let uluru = {lat: 39.9526, lng: -75.1652};
    let marker = new google.maps.Marker({
        position: uluru,
        icon: image,
        title: "Lightning",
        map: map
    });

    marker.addListener('click', function() {
        alert("LIGHTNING");
    })
}

function calcCrow(lat1, lon1) {
    let lat2 = lastLat;
    let lon2 = lastLng;
    let R = 6371;
    let dLat = toRad(lat2 - lat1);
    let dLon = toRad(lon2 - lon1);
    lat1 = toRad(lat1);
    lat2 = toRad(lat2);

    let a = Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    let d = R * c;
    return d;
}

// Converts numeric degrees to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}



/** Loads the state boundary polygons from a GeoJSON source. */
function loadMapShapes() {
  // load US state outline polygons from a GeoJson file
  map.data.loadGeoJson('https://storage.googleapis.com/mapsdevsite/json/states.js', { idPropertyName: 'STATE' });

  // wait for the request to complete by listening for the first feature to be
  // added
  google.maps.event.addListenerOnce(map.data, 'addfeature', function() {
    google.maps.event.trigger(document.getElementById('census-variable'),
        'change');
  });
}

function styleFeature(feature) {
    var low = [5, 69, 54];  // color of smallest datum
    var high = [151, 83, 34];   // color of largest datum

    var color = [];
    for (var i = 0; i < 3; i++) {
        // calculate an integer color based on the delta
        color[i] = (high[i] - low[i]) * Math.random() + low[i];
    }
    var outlineWeight = 0.5, zIndex = 1;
    return {
        strokeWeight: outlineWeight,
        strokeColor: '#fff',
        zIndex: zIndex,
        fillColor: 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)',
        fillOpacity: 0.75,
        visible: true
    };
}





/// gif

function findGif(weatherType) { //doesn't work yet
    var gifString = "http://api.giphy.com/v1/stickers/random?api_key=9NhVNvR04acYobvWGIGoiY5B9pla2JZV&tag=" + weatherType;
    xhr.open("GET", gifString);
    xhr.send();
    xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var data = xhr.responseText;
            return data.data[0].images.downsized.url;//public url to gif < 2 MB
        }
    }
}
