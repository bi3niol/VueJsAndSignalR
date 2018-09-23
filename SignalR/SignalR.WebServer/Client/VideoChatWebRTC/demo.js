function setupVideoChat(hub) {
    var _myConnection, // My RTCPeerConnection instance
        _myMediaStream; // My MediaStream instance

    var vendorUrl = window.URL || window.webkitURL;
    navigator.getMedia = navigator.getUserMedia ||
        navigator.webkitGetUSerMedia ||
        navigator.mozGetUserMedia ||
        navigator.msGetUserMedia;

    // Generates a new connection object and ties up the proper callbacks.
    function _createConnection() {
        console.log('creating RTCPeerConnection...');

        // Create a new PeerConnection
        var connection = new RTCPeerConnection(null); // null = no ICE servers

        // A new ICE candidate was found
        connection.onicecandidate = function (event) {
            if (event.candidate) {
                // Let's send it to our peer via SignalR
                hub.server.sendChatData(JSON.stringify({ "candidate": event.candidate }));
            }
        };

        // New remote media stream was added
        connection.onaddstream = function (event) {
            // Create a new HTML5 Video element
            var newVideoElement = document.createElement('video');
            newVideoElement.className = 'video';
            newVideoElement.autoplay = 'autoplay';
            console.log(event.stream);
            // Attach the stream to the Video element via adapter.js
            newVideoElement.src = vendorUrl.createObjectURL(event.stream);
            newVideoElement.play();

            // Add the new Video element to the page
            document.querySelector('body').appendChild(newVideoElement);

            // Turn off the call button, since we should be in a call now
            document.querySelector('#startBtn').setAttribute('disabled', 'disabled');
        };

        return connection;
    }

    // Callback that receives notifications from the SignalR server
    hub.client.videoChatData = function (data) {
        var message = JSON.parse(data),
            connection = _myConnection || _createConnection(null);

        // An SDP message contains connection and media information, and is either an 'offer' or an 'answer'
        if (message.sdp) {
            connection.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {
                if (connection.remoteDescription.type == 'offer') {
                    console.log('received offer, sending answer...');

                    // Add our stream to the connection to be shared
                    connection.addStream(_myMediaStream);

                    // Create an SDP response
                    connection.createAnswer(function (desc) {
                        // Which becomes our local session description
                        connection.setLocalDescription(desc, function () {
                            // And send it to the originator, where it will become their RemoteDescription
                            hub.server.sendChatData(JSON.stringify({ 'sdp': connection.localDescription }));
                        });
                    }, function (error) { console.log('Error creating session description: ' + error); });
                } else if (connection.remoteDescription.type == 'answer') {
                    console.log('got an answer');
                }
            });
        } else if (message.candidate) {
            console.log('adding ice candidate...');
            connection.addIceCandidate(new RTCIceCandidate(message.candidate));
        }

        _myConnection = connection;
    };

    function init() {
        // Request permissions to the user's hardware
        navigator.getMedia(
            // Media constraints
            {
                video: true,
                audio: true
            },
            // Success callback
            function (stream) {
                var videoElement = document.querySelector('.video.mine');

                // Store off our stream so we can access it later if needed
                _myMediaStream = stream;

                videoElement.src = vendorUrl.createObjectURL(stream);
                videoElement.play();
                videoElement.volume  = 0.0;

                // Now that we have video, we can make a call
                document.querySelector('#startBtn').removeAttribute('disabled');
            },
            // Error callback
            function (error) {
                // Super nifty error handling
                alert(JSON.stringify(error));
            }
        );
    }
    // Hookup the start button functionality
    //$("#startBtn").click(
    var onClick = function () {
        console.log("startBtn click");
        _myConnection = _myConnection || _createConnection(null);

        // Add our stream to the peer connection
        _myConnection.addStream(_myMediaStream);

        // Create an offer to send our peer
        _myConnection.createOffer(function (desc) {
            // Set the generated SDP to be our local session description
            _myConnection.setLocalDescription(desc, function () {
                // And send it to our peer, where it will become their RemoteDescription
                hub.server.sendChatData(JSON.stringify({ "sdp": desc }));
            });
        }, function (error) { console.log('Error creating session description: ' + error); });
    };
    return {
        init: init,
        onClick: onClick
    };
};