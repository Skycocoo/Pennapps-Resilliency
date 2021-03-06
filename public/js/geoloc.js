
function currentLocation(coordinates){
    initMap(coordinates);
}

function coordToCity(lat, long){
    let conn=new XMLHttpRequest();
    let location="https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+long+"key=AIzaSyC7ykUUPTmMCeAfmSTnbk0f0cHnYbojaII";
    conn.open("GET", location);
    conn.send();
    return conn.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            let data = conn.responseText;
            return data.results.address_components[4];//4 gives city
        }
    }
}

function coordToState(lat, long){
    var location="https://maps.googleapis.com/maps/api/geocode/json?latlng="+lat+","+long+"key=AIzaSyC7ykUUPTmMCeAfmSTnbk0f0cHnYbojaII";
    xhr.open("GET", location);
    xhr.send();
    return xhr.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
            var data = web.responseText;
            return data.results.address_components[5];//5 gives state (in 2 letter code)
        }
    }
}

function getGeolocation(){
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(currentLocation); //updates as user moves
    }
}

getGeolocation();
