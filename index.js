var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var lp = require('link-preview-js');

var sqlite3 = require('sqlite3');


let db = new sqlite3.Database('feed.db', (err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the feed database.');
});

// db.run('CREATE TABLE feed(titolo text, url text, descrizione text, image text)');

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname));


// Define/initialize our global vars
var feed = []
var isInitFeed = false
var socketCount = 0
 
io.on('connection', function(socket){
    // Socket has connected, increase socket count
    socketCount++
    // Let all sockets know how many are connected
    io.sockets.emit('users connected', socketCount)
 
    socket.on('disconnect', function() {
        // Decrease the socket count on a disconnect, emit
        socketCount--
        io.sockets.emit('users connected', socketCount)
    })

    socket.on('addElement', function(url){
        console.log('Un elemento sta per essere aggiunto ... ');
        lp.getLinkPreview(url).then((res) => {
            data = {
                url: res.url,
                titolo: res.title,
                descrizione: res.description,
                image: res.images[0],
            }
           
            // New note added, push to all sockets and insert into db
            feed.push(data);

            io.emit('addElement', data);
            // Use node's db injection format to filter incoming data
            db.run("INSERT INTO feed (titolo, url, descrizione, image) VALUES (?, ?, ?, ?)", [data.titolo, data.url, data.descrizione, data.image]);
            console.log('Un nuovo elemento è presente nel database!');
        })
    })
 
    //Check to see if initial query/notes are set
    if (! isInitFeed) {
        // Initial app start, run db query
        let sql = 'SELECT * FROM feed';
        db.each(sql,[],(err, row ) => {
            feed.push(row);
        },function(){
            console.log("L'array è inizializzato, sono pronto per essere consultato");
            socket.emit('initial feed', feed)
        });

        isInitFeed = true
    } else {
        // Initial notes already exist, send out
        socket.emit('initial feed', feed)
    }
})
