var redirect_uri = "";
var client_id = secret.CLIENT_ID;
var client_secret = secret.CLIENT_SECRET;

function onPageLoad(){
    temp_client_id = localStorage.getItem("client_id");
    temp_client_secret = localStorage.getItem("client_secret");
    if (temp_client_id != null) {
        client_id = temp_client_id;
    }
    if (temp_client_secret != null) {
        client_secret = temp_client_secret;
    }
    if ( window.location.search.length > 0 ){
        handleRedirect();
    }
    else {
        access_token = localStorage.getItem("access_token");
        if ( access_token == null ){
            $('#login').show();
            $('#stats').hide();
        }
        else {
            $('#login').hide();
            $('#stats').show();
        }
    }
}

function handleRedirect(){
    let code = getCode();
    fetchAccessToken( code );
    window.history.pushState("", "", redirect_uri); // remove param from url
}

function getCode(){
    let code = null;
    const queryString = window.location.search;
    if ( queryString.length > 0 ){
        const urlParams = new URLSearchParams(queryString);
        code = urlParams.get('code');
    }
    return code;
}

function fetchAccessToken( code ){
    let body = "grant_type=authorization_code";
    body += "&code=" + code; 
    body += "&redirect_uri=" + encodeURI(redirect_uri);
    body += "&client_id=" + client_id;
    body += "&client_secret=" + client_secret;
    callAuthorizationApi(body);
}

function refreshAccessToken(){
    refresh_token = localStorage.getItem("refresh_token");
    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;
    callAuthorizationApi(body);
}

function callAuthorizationApi(body){
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "https://accounts.spotify.com/api/token", true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(client_id + ":" + client_secret));
    xhr.onload = handleAuthorizationResponse;
    xhr.send(body);
}

function handleAuthorizationResponse(){
    if ( this.status == 200 ){
        var data = JSON.parse(this.responseText);
        if ( data.access_token != undefined ){
            access_token = data.access_token;
            localStorage.setItem("access_token", access_token);
        }
        if ( data.refresh_token  != undefined ){
            refresh_token = data.refresh_token;
            localStorage.setItem("refresh_token", refresh_token);
        }
        onPageLoad();
    }
    else {
        console.log(this.responseText);
        alert(this.responseText);
    }
}

function requestAuthorization(){
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret);
    let url = "https://accounts.spotify.com/authorize";
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email";
    window.location.href = url; // Show Spotify's authorization screen
}

function callApi(method, url, body, callback){
    let xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
    xhr.onload = callback;
    xhr.send(body);
}

// search for a track by name
function search() {
    let trackName = document.getElementById("search").value;
    callApi("GET", 'https://api.spotify.com/v1/search?q=' + trackName + '&type=track', null,
    function() {
        if ( this.status == 200 ){
            let tracks = JSON.parse(this.responseText).tracks.items;
            let menu = document.getElementById("results");
            // remove all current options in dropdown menu
            while(menu.firstChild) {
                menu.removeChild(menu.firstChild);
            }
            // add results of search to dropdown menu
            for (let i = 0; i < tracks.length; ++i) {
                let opt = document.createElement('option');
                opt.value = tracks[i].id;
                opt.innerHTML = tracks[i].name + '-' + tracks[i].artists[0].name;
                menu.appendChild(opt);
            }
        }
        else if ( this.status == 401 ){
            refreshAccessToken();
            search();
        }
        else {
            console.log(this.responseText);
            alert(this.responseText);
        }
    })
}

// get features for a track
function getFeatures() {
    let trackId = document.getElementById("results").value;
    callApi("GET", "https://api.spotify.com/v1/audio-features/" + trackId, null,
    function() {
        if ( this.status == 200 ){
            let data = JSON.parse(this.responseText);
            // set key
            if (data.key == 0) {
                data.key = "C";
            } else if (data.key == 1) {
                data.key = "C♯/D♭";
            } else if (data.key == 2) {
                data.key = "D";
            } else if (data.key == 3) {
                data.key = "D♯/E♭";
            } else if (data.key == 4) {
                data.key = "E";
            } else if (data.key == 5) {
                data.key = "F";
            } else if (data.key == 6) {
                data.key = "F♯/G♭";
            } else if (data.key == 7) {
                data.key = "G";
            } else if (data.key == 8) {
                data.key = "G♯/A♭";
            } else if (data.key == 9) {
                data.key = "A";
            } else if (data.key == 10) {
                data.key = "A♯/B♭";
            } else if (data.key == 11) {
                data.key = "B";
            } else if (data.key == -1) {
                data.key = "None";
            }
            // set mode
            data.mode = data.mode ? "Major" : "Minor";
            let featuresSource = document.getElementById("features-template").innerHTML;
            let featuresTemplate = Handlebars.compile(featuresSource);
            document.getElementById("features").innerHTML = featuresTemplate(data);
        }
        else if ( this.status == 401 ){
            refreshAccessToken();
            search();
        }
        else {
            console.log(this.responseText);
            alert(this.responseText);
        }
    })
}
