const socketio = require('socket.io')
const express = require('express')
const cheerio = require('cheerio')
const morgan = require('morgan')
const axios = require('axios')
const http = require('http')
const _ = require('lodash')
const fs = require('fs')

const port = 3005

const app = express()

app.set('view engine', 'ejs')
app.set('views', __dirname + '/views')
app.use(express.static('public'))

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(morgan('dev'))
const server = http.createServer(app)
const io = socketio(server)

app.use('/index', (req, res) => {
    res.render('index')
})

app.use('/download', (req, res) => {

    res.render('download')
    const { url } = req.query

    axios.get(url)
        .then((response) => {
            const $ = cheerio.load(response.data)
            const title = $('#title').attr('title').replace(RegExp(/[\\/:"*?<>|]/g), '')
            io.sockets.emit('title', title)
            const photos = _.map($('.image'), (i) => i.attribs.href)

            if (!fs.existsSync(`./public/${title}`))
                fs.mkdirSync(`./public/${title}`);

            var i = 0
            function request() {
                const filetype = photos[i].split('.').pop();
                numberFile = i + 1
                filename = title + '(' + numberFile + ')';
                return axios({
                    method: 'GET',
                    url: photos[i],
                    responseType: 'stream',
                }).then((resp) => {
                    io.sockets.emit('progress', numberFile + '/' + photos.length);
                    resp.data.pipe(
                        fs.createWriteStream(`./public/${title}/${filename}.${filetype}`),
                        io.sockets.emit('photo', `${title}/${filename}.${filetype}`),
                    );
                    i += 1;
                    if (i >= photos.length) {
                        io.sockets.emit('status', 'download complete');
                    }
                    return request();
                });
            }
            request();
        })
})

server.listen(port,
    () => console.log('WE ARE ONLINE :D')
)