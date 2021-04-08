const socketio = require('socket.io')
const express = require('express')
const cheerio = require('cheerio')
const axios = require('axios')
const http = require('http')
const _ = require('lodash')
const fs = require('fs')

const port = 4000

const app = express()

app.set('view engine', 'ejs')
app.use(express.static('public'))

const server = http.createServer(app)
const io = socketio(server)

io.sockets.on('connection', function (socket) {
    console.log(socket.id)

    socket.on('url', function (url) {
        console.log(url)
        axios.get(url)
            .then((response) => {
                const $ = cheerio.load(response.data)
                const title = $('#title').attr('title').replace(RegExp(/[\\/:"*?<>|]/g), '')

                io.sockets.emit('title', title)

                const photos = _.map($('.image'), (i) => i.attribs.href)

                if (!fs.existsSync(`./public/${title}`))
                    fs.mkdirSync(`./public/${title}`)

                var data = { "title": title, "size": photos.length, "url": url }

                if (!fs.existsSync('log.txt')) {

                }
                fs.appendFile('log.txt', JSON.stringify(data, '/n'), function (error) {
                    if (error)
                        console.log(error)
                })

                var i = 0

                function request() {
                    const filetype = photos[i].split('.').pop();
                    numberFile = i + 1
                    filename = title + '(' + numberFile + ')';

                    var photo = { 'source': `${title}/${filename}.${filetype}`, 'number': numberFile, 'size': photos.length }

                    io.sockets.emit('photo', photo)

                    return axios({
                        method: 'GET',
                        url: photos[i],
                        responseType: 'stream',
                    }).then((resp) => {
                        io.sockets.emit('progress', numberFile + '/' + photos.length);
                        resp.data.pipe(
                            fs.createWriteStream(`./public/${title}/${filename}.${filetype}`),
                        );
                        i++

                        if (i >= photos.length)
                            return io.sockets.emit('status', 'download complete');

                        return request();
                    });
                }
                request();
            })
    })
})

app.use('/', (req, res) => {
    res.render(__dirname + '/views/index')
})

server.listen(port,
    () => console.log('WE ARE ONLINE :D IN ' + port)
)