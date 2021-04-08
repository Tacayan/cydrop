const socket = io('');
var finished = true
var clean = true

let photos = []

$('.downloadButton').click(function (event) {
    event.preventDefault()

    if (clean == false) {
            $('#title').empty()
            $('#progress').empty()
            $('#status').empty()
            $('#photos').empty()
            clean = true
        }

    if (finished == true){
        socket.emit('url', $('.cyberdropLink').val())
        finished = false
    }
})


function renderPhotos(photos, stop) {
    var i = 1
    $('#photos').empty()
    while (i < stop) {
        if (photos[i].split('.').pop() === 'mp4')
            $('#photos').append("<video class='frame' widht='250' height='250' controls><source id='photo' class='preview' src='" + photos[i] + '?' + new Date().getTime() + "' type='video/mp4'></video>")
        else
            $('#photos').append("<div class='frame'><img id='photo' class='preview' widht='250' height='250' src='" + photos[i] + '?' + new Date().getTime() + "'></div>")
        i++
    }
}

function savePhoto(photo) {
    var i = 0
    var stop = ++photo.size
    while (i < stop) {
        if (i == photo.number)
            photos[i] = photo.source
        i++
    }
    setTimeout(() => {
        renderPhotos(photos, stop)
    }, 2000)
}

function renderProgress(progress) {
    $('#progress').html(progress);
}

function renderTitle(title) {
    $('#title').html(title);
}

function renderStatus(status) {
    $('#status').append(status + "<br><a style='color: purple; text-decoration:none;' href='/index'>go back</a>");
}

socket.on('progress', function (progress) {
    renderProgress(progress);
})

socket.on('title', function (title) {
    renderTitle(title);
})

socket.on('status', function (status) {
    renderStatus(status);
    clean = false
    finished = true
})

socket.on('photo', function (photo) {
    savePhoto(photo)
})