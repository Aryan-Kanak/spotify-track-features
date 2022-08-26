var redirect_uri = "https://aryan-kanak.github.io/spotify-track-features";
var client_id = "cbfc4d354b014617b66a9f3225156354";
var client_secret = "7cd9e2657ff24a09acd76fd5eabdd3e4";

function onPageLoad(){
    temp_client_id = sessionStorage.getItem("client_id");
    temp_client_secret = sessionStorage.getItem("client_secret");
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
        access_token = sessionStorage.getItem("access_token");
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
    $.ajax({
        type: "POST",
        url: "https://accounts.spotify.com/api/token",
        headers: {
            'Authorization': 'Basic ' + btoa(client_id + ":" + client_secret),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        success: handleAuthorizationResponse,
        error: errorFunction,
        data: {
            grant_type: "authorization_code",
            code: code,
            redirect_uri: encodeURI(redirect_uri),
            client_id: client_id,
            client_secret: client_secret
        }
    });
}

function refreshAccessToken(){
    refresh_token = sessionStorage.getItem("refresh_token");
    $.ajax({
        type: "POST",
        url: "https://accounts.spotify.com/api/token",
        headers: {
            'Authorization': 'Basic ' + btoa(client_id + ":" + client_secret),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        success: handleAuthorizationResponse,
        error: errorFunction,
        data: {
            grant_type: "refresh_token",
            refresh_token: refresh_token,
            client_id: client_id
        }
    });
}

function handleAuthorizationResponse(response){
    if ( response.access_token != undefined ){
        access_token = response.access_token;
        sessionStorage.setItem("access_token", access_token);
    }
    if ( response.refresh_token  != undefined ){
        refresh_token = response.refresh_token;
        sessionStorage.setItem("refresh_token", refresh_token);
    }
    onPageLoad();
}

function errorFunction() {
    console.log(response);
    alert(response);
}

function requestAuthorization(){
    sessionStorage.setItem("client_id", client_id);
    sessionStorage.setItem("client_secret", client_secret);
    let url = "https://accounts.spotify.com/authorize";
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email";
    window.location.href = url; // Show Spotify's authorization screen
}

function callApi(method, url, body, callback){
    $.ajax({
        type: method,
        url: url,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + access_token
        },
        success: callback,
        error: errorFunction,
        statusCode: {
            401: function() {
                refreshAccessToken();
                callback();
            }
        },
        data: body
    });
}

// search for a track by name
function search() {
    let trackName = document.getElementById("search").value;
    callApi("GET", 'https://api.spotify.com/v1/search?q=' + trackName + '&type=track', null,
    function(response) {
        $('#get-features').show();
        let tracks = response.tracks.items;
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
    });
}

// get features for a track
function getFeatures() {
    let trackId = document.getElementById("results").value;
    callApi("GET", "https://api.spotify.com/v1/audio-features/" + trackId, null,
    function(response) {
        // set key
        if (response.key == 0) {
            response.key = "C";
        } else if (response.key == 1) {
            response.key = "C♯/D♭";
        } else if (response.key == 2) {
            response.key = "D";
        } else if (response.key == 3) {
            response.key = "D♯/E♭";
        } else if (response.key == 4) {
            response.key = "E";
        } else if (response.key == 5) {
            response.key = "F";
        } else if (response.key == 6) {
            response.key = "F♯/G♭";
        } else if (response.key == 7) {
            response.key = "G";
        } else if (response.key == 8) {
            response.key = "G♯/A♭";
        } else if (response.key == 9) {
            response.key = "A";
        } else if (response.key == 10) {
            response.key = "A♯/B♭";
        } else if (response.key == 11) {
            response.key = "B";
        } else if (response.key == -1) {
            response.key = "None";
        }
        // set mode
        response.mode = response.mode ? "Major" : "Minor";
        let featuresSource = document.getElementById("features-template").innerHTML;
        let featuresTemplate = Handlebars.compile(featuresSource);
        document.getElementById("features").innerHTML = featuresTemplate(response);
    });
}
